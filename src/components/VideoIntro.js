// src/components/VideoIntro.js
import React from "react";

const VideoIntro = () => {
  return (
    <div className="video-intro-container">
      <h2 className="section-title">証明写真を簡単に作成</h2>
      <div className="video-wrapper">
        <video controls autoPlay muted loop playsInline className="intro-video">
          <source src="/videos/idphoto.mp4" type="video/mp4" />
          お使いのブラウザは動画の再生に対応していません。
        </video>
      </div>
      <div className="video-description">
        <p>
          自分で撮影した写真からプロ品質の証明写真を数クリックで作成できます。
          マイナンバー、運転免許証、履歴書など、さまざまな用途に対応しています。
        </p>
      </div>
    </div>
  );
};

export default VideoIntro;
