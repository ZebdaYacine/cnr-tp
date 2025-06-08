import { useState } from "react";
import AuthService from "../services/AuthService";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const useLoginViewModel = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.login(email, password);
      console.log("Login response:", response); // Debug log

      if (response.token && response.user) {
        login(response.token, response.user);
        navigate("/dashboard");
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err: unknown) {
      let errorMessage = "An unknown error occurred";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleLogin,
  };
};
