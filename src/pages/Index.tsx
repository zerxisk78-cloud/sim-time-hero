import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">MATSS Scheduling System</h1>
        <p className="text-lg text-muted-foreground">Marine Aviation Training System Site - MCAS Pendleton</p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/schedule"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Schedule Display
          </Link>
          <Link
            to="/guard"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Guard View
          </Link>
          <Link
            to="/admin"
            className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold border border-border hover:opacity-90 transition-opacity"
          >
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
