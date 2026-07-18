from pathlib import Path
import re

import torch
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS


# Change only this path for the first test.
SOURCE = Path(
    "content/items/short-stories/the-tortoise-and-the-hare/"
    "sections/000-pramble/text/en/a2.md"
)


def markdown_to_speech_text(markdown: str) -> str:
    """Perform minimal Markdown cleanup for a first TTS test."""

    # Remove images.
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", markdown)

    # Keep link text but remove the link URL.
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)

    # Remove heading markers.
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)

    # Remove common Markdown formatting characters.
    text = re.sub(r"[*_`>]", "", text)

    # Reduce excessive whitespace.
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Story file not found: {SOURCE}")

    language = SOURCE.parent.name
    level = SOURCE.stem
    section_directory = SOURCE.parents[2]

    output = section_directory / "audio" / f"{language}-{level}.wav"
    output.parent.mkdir(parents=True, exist_ok=True)

    text = markdown_to_speech_text(
        SOURCE.read_text(encoding="utf-8")
    )

    if not text:
        raise ValueError("The story contains no usable speech text.")

    device = "cuda" if torch.cuda.is_available() else "cpu"

    print(f"Device: {device}")
    print(f"Language: {language}")
    print(f"Characters: {len(text)}")
    print(f"Output: {output}")

    model = ChatterboxMultilingualTTS.from_pretrained(
        device=device,
        t3_model="v3",
    )

    audio = model.generate(
        text,
        language_id=language,
    )

    ta.save(
        str(output),
        audio.cpu(),
        model.sr,
    )

    print("Audio generated successfully.")


if __name__ == "__main__":
    main()