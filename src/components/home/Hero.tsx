"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import "./hero-video.css";

const customEase = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="nk-hero-container">
      {/* Top spacer to align with fixed App Bar */}
      <div className="nk-top-spacer" />

      {/* 2. Full-Screen Background Video */}
      <div className="nk-video-stage">
        <motion.video
          className="nk-video-element"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4"
          autoPlay
          muted
          loop
          playsInline
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: customEase }}
        />
      </div>

      {/* 3. Footer Content (Pinned to Bottom, Over Gradient) */}
      <motion.div
        className="nk-footer-wrapper"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1, ease: customEase }}
      >
        <div className="nk-footer-content">
          {/* Left Block */}
          <div className="nk-footer-left">
            {/* Subtitle Line */}
            <motion.div
              className="nk-subtitle-row"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: customEase }}
            >
              <span className="nk-subtitle-dot" />
              <span className="nk-subtitle-text">One Platform. Every Channel. Smarter Growth.</span>
            </motion.div>

            {/* Heading on Two Lines */}
            <motion.h1
              className="nk-heading"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: customEase }}
            >
              Every Channel. Every Lead. <br />
              One Intelligent Platform.
            </motion.h1>

            {/* Two Action Buttons */}
            <motion.div
              className="nk-buttons-row"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8, ease: customEase }}
            >
              <Link href="/login" className="nk-btn-primary">
                Get Started
              </Link>
              <a href="#features" className="nk-btn-secondary">
                Explore Features
              </a>
            </motion.div>
          </div>

          {/* Right Block: Three Tag Pills */}
          <motion.div
            className="nk-footer-right"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8, ease: customEase }}
          >
            <span className="nk-tag-badge">Lead Intelligence</span>
            <span className="nk-tag-badge">AI Agents</span>
            <span className="nk-tag-badge">Visual Automation</span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
