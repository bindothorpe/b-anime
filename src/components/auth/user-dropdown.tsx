"use client";

import {
  Github,
  Keyboard,
  LogOut,
  Settings,
  User as UserIcon,
  UserPlus,
  LogIn,
  Sun,
  Moon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { useAuth } from "@/app/providers/auth-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserDropdown(props: { mobile?: boolean }) {
  const isMobile = props.mobile || false;
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isMobile) {
    return <DropDownMenuMobile handleLogout={handleLogout} />;
  } else {
    return <DropDownMenuDesktop handleLogout={handleLogout} />;
  }
}

function DropDownMenuMobile(props: { handleLogout: () => void }) {
  const { user } = useAuth();
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="account">
        <AccordionTrigger className="hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span>{user ? "My Account" : "Account"}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 px-6">
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <div className="flex items-center gap-2 py-2">
                <Moon className="h-4 w-4" />
                <span>Theme</span>
              </div>
              <Link
                href="/github"
                className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </Link>
              <button
                onClick={props.handleLogout}
                className="flex items-center gap-2 py-2 hover:text-primary transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </Link>
              <Link
                href="/keyboard-shortcuts"
                className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
              >
                <Keyboard className="h-4 w-4" />
                <span>Keyboard shortcuts</span>
              </Link>
              <div className="flex items-center gap-2 py-2">
                <Moon className="h-4 w-4" />
                <span>Theme</span>
              </div>
              <Link
                href="/github"
                className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </Link>
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function DropDownMenuDesktop(props: { handleLogout: () => void }) {
  const { user } = useAuth();
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <span>My Account</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {user ? (
              <>
                <DropdownMenuItem>
                  <Link href={"/profile"} className="flex gap-2">
                    <UserIcon />
                    <span>Profile</span>
                  </Link>
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Link href={"/settings"} className="flex gap-2">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem>
                  <Link href={"/login"} className="flex gap-2">
                    <LogIn />
                    <span>Login</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={"/register"} className="flex gap-2">
                    <UserPlus />
                    <span>Register</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <Link href={"/keyboard-shortcuts"} className="flex gap-2">
              <Keyboard />
              <span>Keyboard shortcuts</span>
            </Link>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Moon />
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem disabled>
                  <Sun />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Moon />
                  <span>Dark</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem disabled>
            <Link href={"/github"} className="flex gap-2">
              <Github />
              <span>GitHub</span>
            </Link>
          </DropdownMenuItem>
          {user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={props.handleLogout}>
                <LogOut />
                <span>Log out</span>
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
