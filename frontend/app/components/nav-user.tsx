"use client"
 
import * as React from "react"
import { ChevronDownIcon, LogOutIcon } from "lucide-react"
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebaseConfig'
import { useRouter } from 'next/navigation'
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar: string
  }
  className?: string
}

export function NavUser({ user, className }: NavUserProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <div className={cn("flex items-center gap-2 px-4", className)}>
      <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`${user.name}'s avatar`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium uppercase text-muted-foreground">
            {user.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium">{user.name}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-8 w-8 relative"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <ChevronDownIcon className="h-4 w-4" />
        <span className="sr-only">User menu</span>
      </Button>
      {isMenuOpen && (
        <div className="absolute bottom-12 right-4 w-48 bg-background border rounded-md shadow-lg z-50">
          <button
            className="w-full text-left px-4 py-2 hover:bg-accent flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOutIcon className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}