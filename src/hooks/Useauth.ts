import { useState, useEffect } from "react";
import { supabase } from "./Useinventory";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) =>
      setUser(session?.user ?? null)
    );
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) throw new Error("รหัสผ่านไม่ตรงกัน!");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: `${firstName} ${lastName}`.trim() } },
        });
        if (error) throw error;
        alert("สมัครสมาชิกสำเร็จ!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => supabase.auth.signOut();

  return {
    user, loading, isSignUp, setIsSignUp,
    firstName, setFirstName, lastName, setLastName,
    email, setEmail, password, setPassword,
    confirmPassword, setConfirmPassword,
    handleAuth, signOut,
  };
};