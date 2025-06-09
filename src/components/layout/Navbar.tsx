import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  BoxIcon,
  ShoppingBag,
  Users,
  Home,
  ClipboardList,
  Calendar,
  // MessageSquare removed
} from "lucide-react";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import NotificationBell from "../notifications/NotificationBell";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle logout navigation
  const handleLogout = () => {
    navigate("/logout");
  };

  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-3d border-b border-white/20"
          : "bg-white/90 backdrop-blur-sm shadow-3d border-b border-white/10"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Logo size={48} className="rounded-full" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Gudang Mitra
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`${
                  isActive("/")
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <Link
                to="/browse"
                className={`${
                  isActive("/browse")
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                <ShoppingBag className="h-4 w-4 mr-1" />
                Browse Items
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/requests"
                    className={`${
                      isActive("/requests")
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    <ClipboardList className="h-4 w-4 mr-1" />
                    Requests
                  </Link>
                  <Link
                    to="/loans"
                    className={`${
                      isActive("/loans")
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Loans
                  </Link>
                  {/* Chat link removed */}
                  {isAdmin && (
                    <>
                      <Link
                        to="/inventory"
                        className={`${
                          isActive("/inventory")
                            ? "border-primary-500 text-primary-600"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                      >
                        <BoxIcon className="h-4 w-4 mr-1" />
                        Inventory
                      </Link>

                      {/* Only show Users link for managers */}
                      {user?.role === "manager" && (
                        <Link
                          to="/users"
                          className={`${
                            isActive("/users")
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                          } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Users
                        </Link>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Authentication Actions */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="relative ml-3 flex items-center">
                <div className="flex items-center space-x-4">
                  {/* Notification Bell */}
                  <NotificationBell />

                  <div className="py-1 px-3 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                    {user?.username}
                    <span className="ml-1 text-xs px-1.5 py-0.5 bg-primary-100 text-primary-800 rounded-md">
                      {user?.role}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    icon={<LogOut className="h-4 w-4" />}
                    className="border-gray-300 hover:bg-gray-100 text-gray-700"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  to="/login"
                  as={Link}
                  className="border-gray-300 hover:bg-gray-100 text-gray-700"
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  to="/register"
                  as={Link}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  Register
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 sm:hidden">
            {/* Mobile Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`${
                isActive("/")
                  ? "bg-primary-50 border-primary-500 text-primary-700"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </div>
            </Link>
            <Link
              to="/browse"
              className={`${
                isActive("/browse")
                  ? "bg-primary-50 border-primary-500 text-primary-700"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Items
              </div>
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/requests"
                  className={`${
                    isActive("/requests")
                      ? "bg-primary-50 border-primary-500 text-primary-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Requests
                  </div>
                </Link>
                <Link
                  to="/loans"
                  className={`${
                    isActive("/loans")
                      ? "bg-primary-50 border-primary-500 text-primary-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Loans
                  </div>
                </Link>
                {/* Mobile chat link removed */}
                {isAdmin && (
                  <>
                    <Link
                      to="/inventory"
                      className={`${
                        isActive("/inventory")
                          ? "bg-primary-50 border-primary-500 text-primary-700"
                          : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                      } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <BoxIcon className="h-4 w-4 mr-2" />
                        Inventory
                      </div>
                    </Link>

                    {/* Only show Users link for managers */}
                    {user?.role === "manager" && (
                      <Link
                        to="/users"
                        className={`${
                          isActive("/users")
                            ? "bg-primary-50 border-primary-500 text-primary-700"
                            : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                        } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Users
                        </div>
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile authentication actions */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user?.username}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <User className="mr-3 h-5 w-5 text-primary-500" />
                      Profile
                    </div>
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <Settings className="mr-3 h-5 w-5 text-primary-500" />
                        Settings
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <LogOut className="mr-3 h-5 w-5 text-primary-500" />
                      Sign out
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 space-y-2">
                <Button
                  variant="outline"
                  fullWidth
                  to="/login"
                  as={Link}
                  onClick={() => setIsMenuOpen(false)}
                  className="border-gray-300"
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  to="/register"
                  as={Link}
                  onClick={() => setIsMenuOpen(false)}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
