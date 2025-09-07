import React, { useState, useRef } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { VolumeHighIcon, PauseIcon } from "@hugeicons/core-free-icons";

function TTSPlayer({ text }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const myhandle = async () => {
    if (audioUrl) {
      handlePlayPause();
    } else {
      handleSpeak();
    }
  };

  const handleSpeak = async () => {
    try {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      const formData = new FormData();
      formData.append("text", text); // ✅ fixed

      const response = await axios.post("http://127.0.0.1:8000/speak", formData, {
        responseType: "blob",
      });

      // ✅ simpler: axios already gives blob
      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.error("Playback failed:", err));
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="p-2">
      <button className="px-4 py-2 text-black rounded" onClick={myhandle}>
        {isPlaying ? (
          <HugeiconsIcon
            icon={PauseIcon}
            size={20}
            color="currentColor"
            strokeWidth={1.5}
          />
        ) : (
          <HugeiconsIcon
            icon={VolumeHighIcon}
            size={20}
            color="currentColor"
            strokeWidth={1.5}
          />
        )}
      </button>

      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        hidden
        controls
      />
    </div>
  );
}

export default TTSPlayer;
