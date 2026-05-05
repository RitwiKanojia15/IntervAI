import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CloudUpload, FileText, CheckCircle2, XCircle, ArrowLeft, File, Loader2 } from "lucide-react";
import { uploadResume } from "../services/api";
import PageWrapper from "../components/PageWrapper";

const ACCEPTED = ["application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ACCEPTED_EXT = [".pdf", ".doc", ".docx"];

const ResumeUpload = () => {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");
  const [analysis, setAnalysis] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const validateFile = (f) => {
    if (!ACCEPTED.includes(f.type) && !ACCEPTED_EXT.some(ext => f.name.toLowerCase().endsWith(ext)))
      return "Please upload a PDF or Word document (.pdf, .doc, .docx)";
    if (f.size > 5 * 1024 * 1024) return "File must be smaller than 5MB";
    return null;
  };

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) { setError(err); setFile(null); return; }
    setError(""); setFile(f); setSuccess(false); setAnalysis(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(0);
    const formData = new FormData();
    formData.append("resume", file);

    const iv = setInterval(() => {
      setProgress(p => { if (p >= 85) { clearInterval(iv); return p; } return p + Math.random() * 14; });
    }, 200);

    try {
      const response = await uploadResume(formData);
      clearInterval(iv);
      setProgress(100);
      setSuccess(true);
      setAnalysis(response.data?.analysis || null);
    } catch (err) {
      clearInterval(iv);
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setProgress(0);
    } finally { setUploading(false); }
  };

  const removeFile = () => {
    setFile(null); setError(""); setSuccess(false); setProgress(0); setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fmtSize = (b) => b < 1024 * 1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;

  return (
    <div className="app-bg min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <PageWrapper>
          {/* Back */}
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm mb-7 transition-colors"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={15} /> Back to Dashboard
          </button>

          {/* Header */}
          <div className="mb-7">
            <span className="teal-badge inline-flex mb-3" style={{ fontSize: "10px" }}>
              <CloudUpload size={11} /> RESUME UPLOAD
            </span>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
              Upload Your Resume
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              We'll analyze your resume to generate personalized interview questions tailored to your experience.
            </p>
          </div>

          {/* Upload card */}
          <div className="dash-card">
            {/* Drop zone */}
            <div
              className={`upload-zone ${dragging ? "drag-over" : ""}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => !file && fileInputRef.current?.click()}
              style={{ cursor: file ? "default" : "pointer" }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx"
                onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
                className="hidden" />

              {!file ? (
                <div>
                  <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                       style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)",
                                boxShadow: "0 6px 20px rgba(20,184,166,0.3)" }}>
                    <CloudUpload size={26} className="text-white" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">
                    {dragging ? "Drop your file here" : "Drag & drop your resume"}
                  </p>
                  <p className="text-xs mb-3" style={{ color: "var(--text-dim)" }}>or click to browse</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {[".pdf", ".doc", ".docx"].map(e => (
                      <span key={e} className="text-xs font-mono px-2 py-1 rounded-md"
                            style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>{e}</span>
                    ))}
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>• Max 5MB</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center
                    ${success ? "bg-teal-600/20" : "bg-teal-500/10"}`}>
                    {success
                      ? <CheckCircle2 size={26} style={{ color: "var(--teal-400)" }} />
                      : <FileText size={26} style={{ color: "var(--teal-400)" }} />
                    }
                  </div>
                  <p className="text-sm font-semibold text-white mb-0.5">{file.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>{fmtSize(file.size)}</p>
                  {success && analysis && (
                    <p className="text-sm mt-2 flex items-center justify-center gap-1.5"
                       style={{ color: "var(--teal-400)" }}>
                      <CheckCircle2 size={13} /> Upload successful! Resume analyzed.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Progress */}
            {uploading && (
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium"
                     style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={11} className="animate-spin" />
                    Uploading and analyzing...
                  </span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{Math.round(progress)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="banner-error mt-4">
                <XCircle size={15} className="flex-shrink-0" /> {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              {file && !success ? (
                <>
                  <button className="btn-outline flex-1" onClick={removeFile} disabled={uploading}>
                    Remove File
                  </button>
                  <button className="btn-teal flex-1" onClick={handleUpload} disabled={uploading}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    {uploading
                      ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                      : <><CloudUpload size={14} /> Upload Resume</>
                    }
                  </button>
                </>
              ) : !file ? (
                <button className="btn-outline w-full"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  onClick={() => fileInputRef.current?.click()}>
                  <File size={14} /> Choose File
                </button>
              ) : null}
            </div>
          </div>

          {/* Info note */}
          <div className="mt-4 rounded-xl px-4 py-3"
               style={{ background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.15)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              <span className="text-white font-semibold">How it works:</span> Our AI parses your resume to
              identify skills, experience, and tech stack — then generates tailored interview questions
              that match your background.
            </p>
          </div>

          {analysis ? (
            <div className="dash-card mt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Resume Strength Analysis</h3>
              <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                {analysis.summary}
              </p>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--teal-400)" }}>
                  Programming Languages
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {analysis.languages?.length ? analysis.languages.join(", ") : "No clear language keywords detected."}
                </p>
              </div>

              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--teal-400)" }}>
                  Skills
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {analysis.skills?.length ? analysis.skills.join(", ") : "No major technical skills detected."}
                </p>
              </div>

              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--teal-400)" }}>
                  Project Titles
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {analysis.projectTitles?.length
                    ? analysis.projectTitles.join(" | ")
                    : "Project titles could not be confidently extracted."}
                </p>
              </div>

              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--teal-400)" }}>
                  Technical Strengths
                </p>
                <ul className="text-sm" style={{ color: "var(--text-muted)", paddingLeft: "18px" }}>
                  {(analysis.technicalStrengths || []).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </PageWrapper>
      </div>
    </div>
  );
};
export default ResumeUpload;
