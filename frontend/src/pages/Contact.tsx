import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Mail, Clock, Send, Twitter, Linkedin, Instagram, MessageSquare, Menu, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  // --- Theme Logic ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    alert(`Thank you, ${formData.name}! Your message has been sent.`);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background pb-20 transition-colors duration-300">
      {/* Shared Header */}
      <header className="sticky top-0 bg-card border-b border-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/">
              <h1 className="text-xl font-bold text-primary">PeerSpace</h1>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>

      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Get In Touch</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have a question or need support? We're here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 border border-border rounded-2xl bg-card">
                <h3 className="text-xl font-semibold mb-6">Quick Info</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 text-left">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary"><Mail className="w-5 h-5" /></div>
                    <div>
                      <p className="font-medium">Support Email</p>
                      <p className="text-muted-foreground text-sm">support@peerspace.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 text-left">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary"><Clock className="w-5 h-5" /></div>
                    <div>
                      <p className="font-medium">Office Hours</p>
                      <p className="text-muted-foreground text-sm">Mon - Fri, 9:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-border rounded-2xl bg-card">
                <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
                <div className="flex gap-3">
                  {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                    <a key={i} href="#" className="p-2.5 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Form) */}
            <div className="lg:col-span-7 p-6 md:p-8 bg-card rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold">Send Us a Message</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Full Name</label>
                    <input name="name" value={formData.name} onChange={handleChange} required
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Subject</label>
                  <select name="subject" value={formData.subject} onChange={handleChange} required
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                    <option value="" disabled>Select a topic</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Message</label>
                  <textarea name="message" rows={4} value={formData.message} onChange={handleChange} required
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all">
                  <Send className="w-4 h-4" /> Submit Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <BottomNav />
    </div>
  );
};

export default Contact;