import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Temporarily allow any email and password to log in
    setTimeout(() => {
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao CRM Acesso Oftalmologia",
      });
      navigate("/dashboard");
      setIsLoading(false);
    }, 1500);
  };

  const handleResetPassword = () => {
    if (!resetEmail) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, insira seu e-mail para redefinir a senha",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "E-mail enviado",
      description: "Instruções de redefinição de senha foram enviadas para seu e-mail",
    });
    
    setResetDialogOpen(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-2 text-center">
        <img 
          src="https://comercial.acessooftalmologia.com.br/storage/u6fzUpkGUZmHIr7udopIxQAJdtV0N6FE98IVs5tV.png" 
          alt="CRM Acesso Oftalmologia Logo" 
          className="w-32 h-auto mx-auto mb-2" 
        />
        <CardTitle className="text-2xl font-bold">CRM Acesso Oftalmologia</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="px-0 font-normal text-xs text-primary">
                    Esqueci minha senha
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Redefinir senha</DialogTitle>
                    <DialogDescription>
                      Digite seu e-mail para receber as instruções de redefinição de senha.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">E-mail</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" onClick={handleResetPassword}>
                      Enviar instruções
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm text-muted-foreground">
        <div className="w-full text-center">
          Entre em contato com o administrador caso precise de ajuda.
        </div>
      </CardFooter>
    </Card>
  );
}

export default LoginForm;
