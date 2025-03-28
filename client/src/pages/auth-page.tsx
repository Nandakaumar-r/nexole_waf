import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Redirect } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldIcon, UserIcon, LockIcon, Mail as MailIcon, BadgeCheck as BadgeIcon } from "lucide-react";

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  fullName: z.string().min(1, "Full name is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  // Only login tab is currently active
  const [activeTab, setActiveTab] = useState<string>("login");

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    await loginMutation.mutateAsync(values);
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    await registerMutation.mutateAsync({
      ...values,
      role: "viewer", // Default role for new users
    });
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-white">
              <ShieldIcon size={24} />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Nexole WAF
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enterprise-grade web application firewall with intelligent threat protection
          </p>

          <div className="mt-8">
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="login" className="w-full">Login</TabsTrigger>
                {/* Registration tab temporarily hidden
                <TabsTrigger value="register">Register</TabsTrigger>
                */}
              </TabsList>
              
              <TabsContent value="login" className="mt-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="admin@nexole.com" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="•••••••••" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Sign in"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register" className="mt-6">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="johndoe" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MailIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="john.doe@example.com" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <BadgeIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="John Doe" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="•••••••••" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-primary/90 to-primary-foreground/90 flex flex-col justify-center p-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-6">
              Protect Your Web Applications
              <br />
              <span className="text-white/80">with AI-Powered Security</span>
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Nexole WAF provides enterprise-grade protection against 
              web attacks, API threats, and malicious traffic. Our intelligent
              system keeps your web assets safe with real-time monitoring 
              and advanced threat detection.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-white/20 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Advanced Protection</h3>
                  <p className="mt-1 text-white/80">Block XSS, SQLi, and OWASP Top Ten threats instantly</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-white/20 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Real-time Monitoring</h3>
                  <p className="mt-1 text-white/80">Visualize attacks and traffic patterns in real-time</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-white/20 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">AI-Powered Analysis</h3>
                  <p className="mt-1 text-white/80">Detect anomalies and zero-day threats with machine learning</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-white/20 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Intelligent Rules</h3>
                  <p className="mt-1 text-white/80">Create and manage custom security rules with ease</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}