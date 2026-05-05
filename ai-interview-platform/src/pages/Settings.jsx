import React, { useState } from "react";
import { Settings as SettingsIcon, Bell, Moon, Shield, ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";

const SettingRow = ({ label, desc, control }) => (
  <div className="setting-row">
    <div>
      <p style={{ fontSize: "13px", fontWeight: 500, color: "white" }}>{label}</p>
      {desc && <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "3px" }}>{desc}</p>}
    </div>
    {control}
  </div>
);

const Toggle = ({ on, onToggle }) => (
  <div className={`toggle-sw ${on ? "on" : ""}`} onClick={onToggle} />
);

const Settings = () => {
  const [s, setS] = useState({
    darkMode: true, emailNotifs: true, pushNotifs: false,
    weeklyReport: true, soundEffects: false, autoSave: true,
    twoFactor: false, publicProfile: true,
  });
  const tog = (k) => setS(p => ({ ...p, [k]: !p[k] }));

  const sections = [
    {
      title: "Appearance", icon: Moon,
      rows: [
        { key: "darkMode",    label: "Dark Mode",      desc: "Use dark theme across the app" },
        { key: "soundEffects",label: "Sound Effects",   desc: "Subtle audio cues during interviews" },
      ]
    },
    {
      title: "Notifications", icon: Bell,
      rows: [
        { key: "emailNotifs",  label: "Email Notifications", desc: "Receive session summaries via email" },
        { key: "pushNotifs",   label: "Push Notifications",  desc: "Browser push alerts for reminders" },
        { key: "weeklyReport", label: "Weekly Report",       desc: "Performance digest every Monday" },
      ]
    },
    {
      title: "Privacy & Security", icon: Shield,
      rows: [
        { key: "twoFactor",    label: "Two-Factor Auth",  desc: "Extra security for your account" },
        { key: "publicProfile",label: "Public Profile",   desc: "Appear on the global leaderboard" },
        { key: "autoSave",     label: "Auto-save Answers",desc: "Save answers as you type" },
      ]
    },
  ];

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px 24px" }}>
        <PageWrapper>
          <div>
            <span className="teal-badge inline-flex mb-3" style={{ fontSize: "10px" }}>
              <SettingsIcon size={10} /> SETTINGS
            </span>
            <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "24px", fontWeight: 800, color: "white", marginBottom: "4px" }}>Settings</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>Manage your account preferences and configurations</p>

            {sections.map(({ title, icon: Icon, rows }) => (
              <div key={title} className="dash-card" style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", paddingBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: "30px", height: "30px", background: "rgba(20,184,166,0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} style={{ color: "var(--teal-400)" }} />
                  </div>
                  <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "14px", fontWeight: 700, color: "white" }}>{title}</h3>
                </div>
                {rows.map(({ key, label, desc }) => (
                  <SettingRow key={key} label={label} desc={desc}
                    control={<Toggle on={s[key]} onToggle={() => tog(key)} />} />
                ))}
              </div>
            ))}

            {/* Account actions */}
            <div className="dash-card">
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "14px", fontWeight: 700, color: "white", paddingBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "4px" }}>Account</h3>
              {[
                { label: "Change Password",    desc: "Update your login credentials",  action: () => {}, color: "var(--text-muted)" },
                { label: "Export My Data",     desc: "Download all your interview data", action: () => {}, color: "var(--text-muted)" },
                { label: "Delete Account",     desc: "Permanently remove all data",    action: () => {}, color: "#f87171" },
              ].map(({ label, desc, color }) => (
                <div key={label} className="setting-row" style={{ cursor: "pointer" }}
                  onMouseEnter={e=>e.currentTarget.style.paddingLeft="4px"}
                  onMouseLeave={e=>e.currentTarget.style.paddingLeft="0"}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 500, color }}>{label}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "3px" }}>{desc}</p>
                  </div>
                  <ChevronRight size={15} style={{ color: "var(--text-dim)" }} />
                </div>
              ))}
            </div>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};
export default Settings;
