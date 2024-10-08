import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { useNavigate } from 'react-router-dom';

function App() {
  const currRef = useRef(null);
  const qrScan = useRef(null);

  const [hasQR, setHasQR] = useState(false);
  const navigate = useNavigate();

  let shouldStop = false;

  const getCurrCamera = () => {
    window.navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        let video = currRef.current;
        let canvas = qrScan.current;
        const context = canvas.getContext('2d');
        video.srcObject = stream;

        video.addEventListener('loadedmetadata', () => {
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          canvas.width = videoWidth;
          canvas.height = videoHeight;

          video.play().then(() => {
            console.log("Video is playing");
            scanQRCode(); 
          }).catch((error) => {
            console.error("Error while trying to play video", error);
          });
        });
      })
      .catch((err) => {
        console.error("Exception while using camera", err);
      });
  };

  const scanQRCode = () => {
    const video = currRef.current;
    const canvas = qrScan.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        drawBoundingBox(context, code.location);
        console.log("QR Code detected:", code.data);
        setHasQR(true);

  
        if(code?.data) {
          navigator.vibrate([200, 100, 200]);
          if (code.data.includes("beckn://")) {
            console.log("Supports beckn");
            window.location.href = code.data;
            // add flag for prompt
            let fallback = true;
            setTimeout(() => {
              if (!shouldStop) {
                fallback = window.confirm("You don't have any compatible app. Do you want to redirect to playstore?");
                if(fallback) {
                  window.location.href = 'https://play.google.com/store/apps/details?id=com.magicpin.local';
                } else { 
                  shouldStop = true; 
                }

                if (shouldStop) {
                  console.log("Stopping");
                  window.close();
                }
              }
            }, 5000);
          }
        }
      } else {
        console.log("No QR code detected");
      }
    }
    requestAnimationFrame(scanQRCode); 
  };

  const drawBoundingBox = (context, location) => {
    if (!location) return;

    // console.log("location.topLeftCorner -", location.topLeftCorner,
    //   "location.topRightCorner -", location.topRightCorner,
    //   "location.bottomRightCorner -", location.bottomRightCorner,
    //   "location.bottomLeftCorner -", location.bottomLeftCorner
    // );

    context.beginPath();
    context.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
    context.lineTo(location.topRightCorner.x, location.topRightCorner.y);
    context.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
    context.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
    context.closePath();
    context.lineWidth = 6;
    context.strokeStyle = 'lime';
    context.stroke();
  };

  useEffect(() => {
    getCurrCamera();
  }, []);

  return (
    <div className="App" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div className='camera' style={{ width: '100%', height: '100%' }}>
        <video ref={currRef} style={{ width: '100%', height: '100%' }}></video>
        <canvas ref={qrScan} style={{ display: 'block' }}></canvas>
        <p>Scan a QR Code</p>
      </div>
      {hasQR && (
        <div className="result hasQR">
          <button onClick={() => setHasQR(false)}>CLOSE</button>
        </div>
      )}
    </div>
  );
}

export default App;


