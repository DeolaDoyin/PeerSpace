import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import CommunityStories from "@/components/landing/CommunityStories";
import CrisisSupport from "@/components/landing/CrisisSupport";
import Guidelines from "@/components/landing/Guidelines";
import Footer from "@/components/landing/Footer";
import "@/styles/index.css"; 
const LandingPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <HeroSection />
      <HowItWorks />
      <CommunityStories />
      <CrisisSupport />
      <Guidelines />
    </main>
    <Footer />
  </div>
);

export default LandingPage;
