import "./styles.css";
import React, { useState, useEffect } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { Button, Col, Row, Image } from "antd";

export default function App() {
  const CAPTURE = { NOT_STARTED: 0, IN_PROGRESS: 1, FINISHED: -1 };
  const [captureStatus, setCaptureStatus] = useState(CAPTURE.NOT_STARTED);
  const [data, setData] = useState([]);
  let view;

  if (captureStatus === CAPTURE.NOT_STARTED) {
    view = (
      <CaptureNotStarted
        onStart={() => setCaptureStatus(CAPTURE.IN_PROGRESS)}
      />
    );
  } else if (captureStatus === CAPTURE.IN_PROGRESS) {
    view = (
      <CaptureInProgress
        startRecording={(event) => {
          let recorder = new MediaRecorder(event.target.captureStream());
          recorder.ondataavailable = (event) => {
            setData((data) => data.push(event.data));
          };
          recorder.start();
          recorder.onstop = (event) => {
            setData(data);
            setCaptureStatus(CAPTURE.FINISHED);
          };
        }}
      />
    );
  } else if (captureStatus === CAPTURE.FINISHED) {
    view = <CaptureFinished recordedChunks={data} />;
  }

  return <div className="App">{view}</div>;
}

function CaptureNotStarted({ onStart }) {
  return (
    <Button type="primary" size="large" onClick={onStart}>
      Start Capture
    </Button>
  );
}

function CaptureInProgress({ startRecording }) {
  useEffect(() => {
    let videoElement = document.getElementById("video");
    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          cursor: "always"
        },
        audio: false
      })
      .then((captureStream) => {
        videoElement.srcObject = captureStream;
        videoElement.captureStream =
          videoElement.captureStream || videoElement.mozCaptureStream;
      })
      .catch((err) => {
        console.error(`Error:${err}`);
        return null;
      });
    videoElement.addEventListener("playing", startRecording);
    // videoElement.requestVideoFrameCallback(takeManyPicture);
  }, [startRecording]);

  return <video id="video" autoPlay></video>;
}

function CaptureFinished({ recordedChunks }) {
  const [src, setSrc] = useState();
  const [imageGallery, setImageGallery] = useState({});

  function extractImages(event) {
    if (
      event.target.duration === Infinity ||
      event.target.currentTime < event.target.duration
    ) {
      event.target.currentTime = event.target.currentTime + 1;
      // return;
    }

    // let canvas = document.createElement("canvas");
    // // const context = canvas.getContext("2d", { willReadFrequently: true });
    // const context = canvas.getContext("2d");
    // context.drawImage(event.target, 0, 0, canvas.width, canvas.height);
    // const data = context.getImageData(0, 0, canvas.width, canvas.height);
    // setImageGallery((imageGallery) => {
    //   imageGallery.push(data);
    //   return imageGallery;
    // });
    let canvas = document.createElement("canvas");
    canvas.width = event.target.videoWidth;
    canvas.height = event.target.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(event.target, 0, 0, canvas.width, canvas.height);
    let newImage = { src: canvas.toDataURL("image/png") };
    // context.drawImage(
    //   event.target,
    //   0,
    //   0,
    //   event.target.videoWidth,
    //   event.target.videoHeight
    // );
    // newImage["image"] = canvas.toDataURL("image/png");

    let newGal = { ...imageGallery };
    newGal[event.target.currentTime] = newImage;
    setImageGallery(newGal);
    console.log(imageGallery);
    // let gal = [];
    // for (let index = 0; index < event.target.duration; index++) {
    //   context.drawImage(event.target, 0, 0, canvas.width, canvas.height);
    //   const data = canvas.toDataURL("image/png");
    //   gal.push(data);
    // }
    // setImageGallery(gal);
  }

  useEffect(() => {
    let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
    setSrc(URL.createObjectURL(recordedBlob));
  }, []);

  const keys = Object.keys(imageGallery);
  const avatars = keys.map((key, index) => (
    <Image width={250} src={imageGallery[key]["src"]} key={index} />
  ));

  return (
    <>
      {/* <video id="recorded" src={src} controls onSeeked={extractImages}></video> */}
      <video id="recorded" src={src} controls onCanPlay={extractImages}></video>
      {/* <canvas id="canvas"> </canvas> */}
      <Button
        id="downloadButton"
        download="RecordedVideo.webm"
        type="primary"
        shape="circle"
        icon={<DownloadOutlined />}
        size="large"
        href={src}
      />
      {avatars}
    </>
  );
}
