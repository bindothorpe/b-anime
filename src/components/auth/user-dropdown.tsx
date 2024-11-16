"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { LogoutButton } from "../logout-button";
import { useAuth } from "@/app/providers/auth-provider";
import Link from "next/link";

export default function UserDropdown(props: { mobile?: boolean }) {
  const { user } = useAuth();
  const isMobile = props.mobile || false;

  if (user) {
    console.log(user);
  }

  if (isMobile) {
    return (
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Account</AccordionTrigger>
          <AccordionContent>
            {user ? (
              <>
                <div>Profile</div>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login">Login</Link>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  } else {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>Account</DropdownMenuTrigger>
        <DropdownMenuContent>
          {user ? (
            <>
              <DropdownMenuItem>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <LogoutButton />
            </>
          ) : (
            <DropdownMenuItem>
              <Link href="/login">Login</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
