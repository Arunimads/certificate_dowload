import { useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./App.css";

function App() {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [certificateData, setCertificateData] = useState("");
  const [loading, setLoading] = useState(false);
  const certificateRef = useRef(null);

  const handleChange = (e) => {
    setCertificateNumber(e.target.value);
  };

  const handleSubmit = async () => {
    if (!certificateNumber) {
      Swal.fire("Error", "Please enter a certificate number", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "https://app.witsclass.com/console/RSIDC/micros/Api/Auth/certificate_details",
        { certificate_number: certificateNumber }
      );
      if (response.data.data.length > 0) {
        setCertificateData(response.data.data);
        Swal.fire("Success!", response.data.message, "success");
      } else {
        Swal.fire("Not Found!", response.data.message, "error");
        setCertificateNumber("");
      }
    } catch (error) {
      Swal.fire("Error", "An error occurred while fetching the data.", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificateData || !certificateRef.current) {
      Swal.fire("Error", "Certificate data not found!", "error");
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const canvas = await html2canvas(certificateRef.current, {
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );
      pdf.save(`certificate_${certificateNumber}.pdf`);

      setCertificateNumber("");
      setCertificateData("");
    } catch (error) {
      console.error("Download error:", error);
      Swal.fire("Error", "Failed to generate PDF. Please try again.", "error");
    }
  };

  return (
    <div className="container">
      <div className="card">
        {!certificateData && (
          <div className="input-card">
            <h3>Enter Your Certificate Number</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter Certificate Number"
                onChange={handleChange}
                value={certificateNumber}
                className="input-field"
              />
              <button
                onClick={handleSubmit}
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "LOADING..." : "SUBMIT"}
              </button>
            </div>
          </div>
        )}

        <div>
          {certificateData && (
            <div
              ref={certificateRef}
              className="certificate-container"
              dangerouslySetInnerHTML={{ __html: certificateData }}
            />
          )}

          {certificateData && (
            <div className="download-section">
              <button onClick={handleDownload} className="download-btn">
                DOWNLOAD
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
