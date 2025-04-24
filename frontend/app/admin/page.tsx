"use client"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ScrollArea } from "../components/ui/scroll-area"

export default function BlocksPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-2">UI Blocks</h1>
      <p className="text-muted-foreground mb-6">
        Ready-to-use UI components for your next project.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Button Variants Block */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>Different button styles available in the UI library.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Button components with different variants
          </CardFooter>
        </Card>

        {/* Button Sizes Block */}
        <Card>
          <CardHeader>
            <CardTitle>Button Sizes</CardTitle>
            <CardDescription>Different size options for buttons.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex items-center gap-4">
              <Button size="icon" variant="outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Button>
              <Button size="icon" variant="outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Button components with different sizes
          </CardFooter>
        </Card>

        {/* Card Block */}
        <Card>
          <CardHeader>
            <CardTitle>Card Component</CardTitle>
            <CardDescription>A versatile card component for various content.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Cards can be used to group related content and actions.</p>
              <p className="text-sm text-muted-foreground">
                They're perfect for displaying a summary of information.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" size="sm">Cancel</Button>
            <Button size="sm">Save</Button>
          </CardFooter>
        </Card>

        {/* Login Form Block */}
        <Card>
          <CardHeader>
            <CardTitle>Login Form</CardTitle>
            <CardDescription>A simple login form using card and form components.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input id="password" type="password" />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Login</Button>
          </CardFooter>
        </Card>

        {/* Stacked Form Block */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="johndoe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" defaultValue="Software Engineer and Designer" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        {/* Notification Card Block */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <div className="grid gap-1">
              <CardTitle>Notification Card</CardTitle>
              <CardDescription>Display important alerts and updates.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p>You have 3 unread messages in your inbox.</p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full">View All</Button>
          </CardFooter>
        </Card>

        {/* Pricing Card Block */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>Perfect for growing businesses.</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold">$29</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Unlimited projects
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Advanced analytics
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Priority support
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Get Started</Button>
          </CardFooter>
        </Card>

        {/* Input Showcase Block */}
        <Card>
          <CardHeader>
            <CardTitle>Input Variants</CardTitle>
            <CardDescription>Different styles and states for input fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default">Default</Label>
              <Input id="default" placeholder="Default input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disabled">Disabled</Label>
              <Input id="disabled" placeholder="Disabled input" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="with-icon">With Icon</Label>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <Input id="with-icon" className="pl-10" placeholder="Search..." />
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Various input field examples
          </CardFooter>
        </Card>

        {/* Scroll Area Block */}
        <Card>
          <CardHeader>
            <CardTitle>Scroll Area</CardTitle>
            <CardDescription>A scrollable area with custom scrollbars.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72 rounded-md border p-4">
              <div className="space-y-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-muted"></div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">User {i + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        user{i + 1}@example.com
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Scroll area with custom scrollbars
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}