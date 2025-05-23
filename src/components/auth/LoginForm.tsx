import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to home page
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log(`Attempting to login with email: ${email}`);

      // Try direct fetch to test API connection
      try {
        console.log('Testing direct API connection...');
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        console.log('Using API URL:', apiUrl);
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        console.log(`Direct API test - Response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Direct API test - Response text: ${responseText.substring(0, 100)}...`);

        try {
          const data = JSON.parse(responseText);
          console.log('Direct API test - Parsed JSON:', data);
        } catch (e) {
          console.error('Direct API test - Failed to parse JSON:', e);
        }
      } catch (directError) {
        console.error('Direct API test - Error:', directError);
      }

      // Now try the regular login
      await login(email, password);
      // After successful login, navigate to home page
      navigate("/", { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Or{" "}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </a>
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert
              variant="error"
              title="Authentication Error"
              onDismiss={() => setError(null)}
              className="mb-4"
            >
              {error}
            </Alert>
          )}



          <form onSubmit={handleSubmit}>
            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Enter your email"
            />

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              icon={<LogIn className="h-4 w-4" />}
            >
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
