import { useState } from "react";
import AuthService from "../services/AuthService";
import { useNavigate } from "react-router-dom";

export const useRegisterViewModel = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.register(name, email, password);
      alert("Registration successful! Please log in.");
      navigate("/login");
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
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleRegister,
  };
};
