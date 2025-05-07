import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RealtimeChat } from "@/components/realtime-chat";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <header className="bg-blue-50 shadow-sm py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-xl font-bold text-blue-900">Real Estate Management</h1>
          <nav className="flex gap-4">
            <Link href="/auth/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-blue-800 hover:bg-blue-900 text-white">Register</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-blue-900">Manage Your Real Estate Portfolio</h2>
            <p className="text-lg text-blue-800 mb-8">
              Streamline your property management with our all-in-one platform.
              Track rentals, maintenance, and communicate with tenants all in one place.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button className="bg-blue-700 hover:bg-blue-800 text-white" size="lg">Get Started</Button>
              </Link>
              <Link href="#features">
                <Button className="bg-blue-200 text-blue-800 hover:bg-blue-300" size="lg">Learn More</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-800">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
              <h3 className="text-xl font-semibold mb-3 text-blue-700">Property Management</h3>
              <p className="text-blue-900">Easily manage all your properties in one dashboard.</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
              <h3 className="text-xl font-semibold mb-3 text-blue-700">Tenant Communication</h3>
              <p className="text-blue-900">Real-time messaging with tenants and maintenance staff.</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
              <h3 className="text-xl font-semibold mb-3 text-blue-700">Financial Tracking</h3>
              <p className="text-blue-900">Track rent payments and expenses in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Chat Support Section */}
      <section className="py-16 bg-blue-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-blue-800">Questions? Chat With Us</h2>
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6 border border-blue-300">
            <RealtimeChat roomName="public-support" username="visitor" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Real Estate Management App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}