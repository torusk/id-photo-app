// src/components/FlowGuide.js
import React from "react";

const FlowGuide = ({ activeStep }) => {
  return (
    <section className="flow">
      <h2 className="section-title">ご利用の流れ</h2>
      <div className="wrapper">
        <div className="item">
          <div className={`step ${activeStep >= 1 ? "active" : ""}`}>
            <span className="title">STEP</span>
            <span className="no">1</span>
          </div>
          <dl className="text">
            <dt>証明写真の種類を選択</dt>
            <dd>
              作成したい証明写真の種類とサイズを選択します。
              <br />
              運転免許証用、履歴書用、マイナンバー用など目的に合わせて選びましょう。
            </dd>
          </dl>
        </div>

        <div className="item">
          <div className={`step ${activeStep >= 2 ? "active" : ""}`}>
            <span className="title">STEP</span>
            <span className="no">2</span>
          </div>
          <dl className="text">
            <dt>画像をアップロード</dt>
            <dd>
              証明写真にしたい画像をアップロードします。
              <br />
              明るい場所で撮影された正面顔の写真が最適です。
            </dd>
          </dl>
        </div>

        <div className="item">
          <div className={`step ${activeStep >= 3 ? "active" : ""}`}>
            <span className="title">STEP</span>
            <span className="no">3</span>
          </div>
          <dl className="text">
            <dt>顔の位置を調整</dt>
            <dd>
              顔が写真の中心に来るように位置を調整します。
              <br />
              頭頂部から顎までの比率も重要なので、ガイドラインに従って調整してください。
            </dd>
          </dl>
        </div>

        <div className="item">
          <div className={`step ${activeStep >= 4 ? "active" : ""}`}>
            <span className="title">STEP</span>
            <span className="no">4</span>
          </div>
          <dl className="text">
            <dt>証明写真の完成</dt>
            <dd>
              完成した証明写真をダウンロードします。
              <br />
              L判サイズ用にレイアウトされるので、コンビニなどで簡単に印刷できます。
            </dd>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default FlowGuide;
