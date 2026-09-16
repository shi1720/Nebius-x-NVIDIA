# RecallRoom recorded walkthrough

- Watch: https://recallroom.web.app/demo.html
- MP4: https://recallroom.web.app/demo/RecallRoom-demo.mp4
- Captions: https://recallroom.web.app/demo/RecallRoom-captions.srt
- Duration: 150.25 seconds, 1920 by 1080, H.264 video with AAC audio.

The walkthrough uses actual captured application screens. It is an edited sequence of product states, with a neutral synthetic voice generated using OpenAI TTS and visible captions. It does not imitate Shivam Gupta's voice. All records are fictional.

The provider scene shows NVIDIA Nemotron on Nebius Token Factory, its extraction proposal, and the real run history. Application code validates source evidence and calculates scope; a person reviews the proposal before import. The synthetic fixture report is in `docs/evaluation/live-nebius.json`. One synthetic drill does not establish real-world recall accuracy.

## Reproduce the recording

The source narration is in `narration-segments.json`. Put an OpenAI API key in the ignored `.env.local` file, and install Python Pillow plus FFmpeg with libx264. The renderer uses macOS Arial fonts. Source screenshots and working media live in ignored `outputs/video/frames` and `outputs/video`.

```sh
python3 scripts/generate-narration.py
python3 scripts/assemble-narration.py
python3 scripts/caption-video.py
python3 scripts/render-demo.py
cp outputs/video/RecallRoom-demo.mp4 public/demo/
cp outputs/video/RecallRoom-captions.srt public/demo/
```

Narration and alignment use content hashes to reuse unchanged segments. The audio assembler normalizes the format, adds a short pause between segments, and writes measured durations. Caption alignment is performed per segment to avoid skipped short sentences. The renderer burns readable captions into a 1080p video and also creates an SRT subtitle file.

The finished MP4 and SRT are versioned in `public/demo`. The current YouTube title, description, and public URL are tracked in `docs/submission/youtube.md`. Verify public playback after each replacement upload before submitting its URL to Devpost.
