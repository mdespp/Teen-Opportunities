"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SubmitSection from "@/components/SubmitSection";
import OpportunitiesSection from "@/components/OpportunitiesSection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";
import NewsletterWelcomeModal from "@/components/NewsletterWelcomeModal";

export default function HomePage() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const hasSeenModal = window.sessionStorage.getItem("hasSeenWelcomeModal");

    if (!hasSeenModal) {
      const timer = window.setTimeout(() => {
        setShowWelcomeModal(true);
      }, 250);

      return () => window.clearTimeout(timer);
    }
  }, []);

  function handleCloseModal() {
    window.localStorage.setItem("hasSeenWelcomeModal", "true");
    setShowWelcomeModal(false);
  }

  return (
    <>
      <Navbar />
      <HeroSection />

      <section
  id="submit"
  className="scroll-mt-32 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8"
>
  <SubmitSection />
</section>

      <OpportunitiesSection />
      <NewsletterSection />
      <Footer />

      <NewsletterWelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseModal}
      />
    </>
  );
}