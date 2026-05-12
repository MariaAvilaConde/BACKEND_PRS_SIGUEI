import { useState, useEffect, useRef } from "react";
import { X, Camera, AlertCircle, CheckCircle, Scan } from "lucide-react";
import jsQR from "jsqr";
import Swal from "sweetalert2";

function Modal({ isOpen, onClose, title, children }) {
     if (!isOpen) return null;
     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
                    <div className="fixed inset-0 bg-black opacity-70" onClick={onClose}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[95vh] flex flex-col">
                         <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-lg z-10">
                              <h2 className="text-base font-semibold flex items-center gap-2">
                                   <Camera className="w-5 h-5 text-primary-600" />
                                   <span className="truncate">{title}</span>
                              </h2>
                              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                   <X className="w-5 h-5" />
                              </button>
                         </div>
                         <div className="overflow-y-auto flex-1">
                              <div className="p-4">{children}</div>
                         </div>
                    </div>
               </div>
          </div>
     );
}

export default function QRScannerModal({ open, onClose, onScan }) {
     const videoRef = useRef(null);
     const canvasRef = useRef(null);
     const [scanning, setScanning] = useState(false);
     const [error, setError] = useState(null);
     const [stream, setStream] = useState(null);
     const [manualInput, setManualInput] = useState("");
     const [loading, setLoading] = useState(false);
     const scanIntervalRef = useRef(null);

     useEffect(() => {
          let mounted = true;
          
          if (open) {
               setLoading(true);
               setScanning(false);
               setError(null);
               
               const initCamera = async () => {
                    try {
                         const mediaStream = await navigator.mediaDevices.getUserMedia({
                              video: { 
                                   facingMode: "environment",
                                   width: { ideal: 1920, min: 1280 },
                                   height: { ideal: 1080, min: 720 },
                                   focusMode: "continuous",
                                   zoom: true
                              }
                         });
                         
                         if (!mounted) {
                              mediaStream.getTracks().forEach(track => track.stop());
                              return;
                         }
                         
                         setStream(mediaStream);
                         
                         await new Promise(resolve => setTimeout(resolve, 100));
                         
                         if (videoRef.current) {
                              videoRef.current.srcObject = mediaStream;
                              videoRef.current.muted = true;
                              
                              try {
                                   await videoRef.current.play();
                                   if (mounted) {
                                        setScanning(true);
                                        setLoading(false);
                                   }
                              } catch (playErr) {
                                   if (mounted) {
                                        setError("No se pudo reproducir el video.");
                                        setLoading(false);
                                   }
                              }
                         } else {
                              if (mounted) {
                                   setError("Error al inicializar el video.");
                                   setLoading(false);
                              }
                         }
                    } catch (err) {
                         if (mounted) {
                              let errorMessage = "No se pudo acceder a la cámara.";
                              
                              if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                                   errorMessage = "Permiso de cámara denegado.";
                              } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                                   errorMessage = "No se encontró ninguna cámara.";
                              } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                                   errorMessage = "La cámara está siendo usada por otra aplicación.";
                              }
                              
                              setError(errorMessage);
                              setLoading(false);
                         }
                    }
               };
               
               initCamera();
          } else {
               if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
               }
               if (videoRef.current) {
                    videoRef.current.srcObject = null;
               }
               if (scanIntervalRef.current) {
                    clearInterval(scanIntervalRef.current);
               }
               setScanning(false);
               setLoading(false);
          }

          return () => {
               mounted = false;
               if (stream) {
                    stream.getTracks().forEach(track => track.stop());
               }
               if (scanIntervalRef.current) {
                    clearInterval(scanIntervalRef.current);
               }
          };
     }, [open]);

     const handleCapturePhoto = () => {
          if (!videoRef.current || !canvasRef.current) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          console.log("📸 Capturando foto para análisis...");
          console.log("Dimensiones:", canvas.width, "x", canvas.height);
          
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
               inversionAttempts: "attemptBoth",
          });

          if (code && code.data) {
               console.log("✅ QR detectado en foto:", code.data);
               handleQRCodeDetected(code.data);
          } else {
               console.log("❌ No se detectó QR en la foto");
               Swal.fire({
                    title: "QR no detectado",
                    text: "No se pudo leer el código QR. Asegúrate de tener buena iluminación y que el QR esté enfocado.",
                    icon: "warning",
                    confirmButtonText: "Reintentar",
                    confirmButtonColor: "#3b82f6",
                    showCancelButton: true,
                    cancelButtonText: "Usar ingreso manual",
                    cancelButtonColor: "#6b7280",
                    customClass: {
                         popup: 'rounded-lg',
                         title: 'text-lg font-semibold',
                         confirmButton: 'px-5 py-2.5 rounded-lg font-medium',
                         cancelButton: 'px-5 py-2.5 rounded-lg font-medium'
                    }
               });
          }
     };

     const handleQRCodeDetected = (data) => {
          console.log("📦 Procesando datos del QR:", data);
          try {
               // El QR ahora solo contiene el ID del estudiante (no JSON)
               const studentId = data.trim();
               console.log("👤 ID del estudiante:", studentId);
               
               // Mostrar alerta de éxito
               Swal.fire({
                    title: "¡QR escaneado!",
                    text: "Estudiante agregado correctamente",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                         popup: 'rounded-lg',
                         title: 'text-lg font-semibold'
                    }
               });
               
               onScan({ studentId });
               stopCamera();
               onClose();
          } catch (err) {
               console.error("❌ Error procesando QR:", err);
               Swal.fire({
                    title: "Error al procesar",
                    text: "No se pudo procesar el código QR. Intenta nuevamente o usa el ingreso manual.",
                    icon: "error",
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#3b82f6",
                    customClass: {
                         popup: 'rounded-lg',
                         title: 'text-lg font-semibold',
                         confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
                    }
               });
          }
     };

     const stopCamera = () => {
          if (stream) {
               stream.getTracks().forEach(track => track.stop());
               setStream(null);
          }
          
          if (videoRef.current) {
               videoRef.current.srcObject = null;
          }
          
          setScanning(false);
          setLoading(false);
     };

     const retryCamera = async () => {
          setError(null);
          setLoading(true);
          setScanning(false);
          
          // Detener stream actual
          if (stream) {
               stream.getTracks().forEach(track => track.stop());
               setStream(null);
          }
          
          // Reiniciar cámara
          try {
               const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                         facingMode: "environment",
                         width: { ideal: 1920, min: 1280 },
                         height: { ideal: 1080, min: 720 }
                    }
               });
               
               setStream(mediaStream);
               
               if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.muted = true;
                    await videoRef.current.play();
                    setScanning(true);
                    setLoading(false);
               }
          } catch (err) {
               setError("No se pudo reiniciar la cámara");
               setLoading(false);
          }
     };

     const handleManualSubmit = (e) => {
          e.preventDefault();
          if (manualInput.trim() && manualInput.length === 8) {
               console.log("📝 Buscando estudiante por DNI:", manualInput.trim());
               // Buscar estudiante por DNI en lugar de ID
               onScan({ dni: manualInput.trim() });
               stopCamera();
               onClose();
          }
     };

     return (
          <Modal isOpen={open} onClose={onClose} title="Escanear Código QR del Estudiante">
               <div className="space-y-4">
                    {error && (
                         <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <p className="text-sm text-red-800">{error}</p>
                         </div>
                    )}

                    <div className="relative bg-black rounded-lg overflow-hidden w-full h-[250px] sm:h-[300px]">
                         <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-contain ${scanning ? 'block' : 'hidden'}`}
                         />
                         
                         <canvas ref={canvasRef} className="hidden" />
                         
                         {loading && !scanning && !error && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black">
                                   <div className="text-center text-white px-4">
                                        <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">Iniciando cámara...</p>
                                   </div>
                              </div>
                         )}
                         
                         {scanning && (
                              <>
                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-40 h-40 sm:w-48 sm:h-48 border-4 border-green-500 rounded-lg relative">
                                             <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                                             <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                                             <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                                             <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                                        </div>
                                   </div>
                                   
                                   <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none px-2">
                                        <p className="text-white text-sm bg-black/60 inline-block px-4 py-2 rounded">
                                             Apunta al código QR y presiona "Capturar"
                                        </p>
                                   </div>
                              </>
                         )}
                         
                         {error && !loading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black">
                                   <div className="text-center text-white px-4">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                                        <p className="text-sm mb-2">No se pudo iniciar la cámara</p>
                                        <p className="text-xs text-gray-400">Usa el ingreso manual</p>
                                   </div>
                              </div>
                         )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                         <p className="text-sm font-medium text-gray-700 mb-3">Instrucciones:</p>
                         <ol className="text-sm text-gray-600 space-y-1 mb-4 list-decimal list-inside">
                              <li>Apunta la cámara al código QR</li>
                              <li>Asegúrate de que esté enfocado</li>
                              <li>Presiona el botón para capturar</li>
                         </ol>
                         <button
                              type="button"
                              onClick={handleCapturePhoto}
                              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                         >
                              <Scan className="w-5 h-5" />
                              Capturar y Escanear QR
                         </button>
                    </div>

                    {error && (
                         <div className="flex justify-center">
                              <button
                                   type="button"
                                   onClick={retryCamera}
                                   className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                              >
                                   Reintentar Cámara
                              </button>
                         </div>
                    )}

                    <div className="border-t pt-4 mt-4">
                         <form onSubmit={handleManualSubmit} className="space-y-3">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ingreso Manual por DNI
                                   </label>
                                   <input
                                        type="text"
                                        value={manualInput}
                                        onChange={(e) => setManualInput(e.target.value)}
                                        placeholder="Ingresa el DNI (8 dígitos)"
                                        maxLength="8"
                                        pattern="[0-9]{8}"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-mono"
                                   />
                              </div>
                              
                              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                                   <button
                                        type="button"
                                        onClick={() => {
                                             stopCamera();
                                             onClose();
                                        }}
                                        className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                   >
                                        Cancelar
                                   </button>
                                   <button
                                        type="submit"
                                        disabled={!manualInput.trim() || manualInput.length !== 8}
                                        className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        Buscar y Agregar
                                   </button>
                              </div>
                         </form>
                    </div>
               </div>


          </Modal>
     );
}
