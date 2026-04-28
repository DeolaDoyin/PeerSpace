import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import CommunityStories from "@/components/landing/CommunityStories";
import CrisisSupport from "@/components/landing/CrisisSupport";
import Guidelines from "@/components/landing/Guidelines";
import Footer from "@/components/landing/Footer";
import "@/styles/index.css"; 

const LandingPage = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Remove the '#' from the hash to get the ID
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      
      if (element) {
        // Timeout ensures the section is fully rendered before scrolling
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100); 
      }
    }
  }, [hash]); // Runs whenever the URL hash changes

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <CommunityStories />
        
        {/* Wrap CrisisSupport with the ID so it scrolls to the right place */}
        <section id="crisis">
          <CrisisSupport />
        </section>
        
        <Guidelines />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;