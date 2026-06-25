import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Building2, 
  Upload, 
  FileText, 
  Settings, 
  Plus,
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import React, { useEffect, useState, useRef } from 'react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Companies', path: '/companies', icon: Building2 },
  { name: 'Import', path: '/import', icon: Upload },
  { name: 'Resumes', path: '/resumes', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { theme, setTheme, user, logout } = useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className={cn(
      "flex h-screen overflow-hidden antialiased",
      "bg-background text-foreground"
    )}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-52 border-r flex flex-col transition-transform bg-sidebar border-border duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 pb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center font-bold shadow-sm">L</div>
          <div>
            <h1 className="font-semibold text-[15px] text-foreground leading-tight tracking-tight">LeadFlow</h1>
            <p className="text-[11px] text-foreground-faint font-medium tracking-wide uppercase mt-0.5">Pipeline CRM</p>
          </div>
          <button 
            className="md:hidden ml-auto text-foreground-muted" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-secondary text-primary" 
                    : "text-foreground-muted hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-foreground-faint")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-border">
          <button className="w-full bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 px-4 md:px-8 border-b flex items-center justify-between shrink-0 bg-surface/50 backdrop-blur-sm border-border relative z-30">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden p-2 -ml-2 text-foreground-muted hover:bg-secondary hover:text-foreground rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 max-w-lg relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint" />
              <input 
                type="text" 
                placeholder="Search companies, contacts..." 
                className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground shadow-sm placeholder:text-foreground-faint"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 ml-4">
            <button className="p-2 text-foreground-muted hover:bg-secondary hover:text-foreground rounded-md transition-colors hidden sm:block">
              <Bell className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-foreground-muted hover:bg-secondary hover:text-foreground rounded-md transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full ml-2 overflow-hidden border border-border hover:ring-2 ring-primary/20 transition-all focus:outline-none"
              >
                <img src="https://ui-avatars.com/api/?name=Alex&background=F4F6FB&color=7C3AED" alt="Avatar" className="w-full h-full object-cover" />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-card py-1 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-foreground-muted truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full px-4 py-2 text-left text-sm text-foreground-muted hover:text-foreground hover:bg-secondary flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-foreground-muted hover:text-foreground hover:bg-secondary flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                  <div className="border-t border-border py-1">
                    <button 
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-sm text-error-text hover:bg-error-bg/50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
