# Unlearned Sensors Assistant

## Installation

1. **Clone the repository**
   ```sh
   git clone <repository-url>
   cd unlearned-sensors-assistant
   ```

2. **Install dependencies**

   If you are using `pip`:
   ```sh
   pip install -r requirements.txt
   ```

   Or, if you are using `conda`:
   ```sh
   conda env create -f environment.yml
   conda activate unlearned-sensors-assistant
   ```

3. **(Optional) Install additional development dependencies**
   ```sh
   pip install -r requirements-dev.txt
   ```

## Frontend Setup

The frontend is located in the `/frontend` directory and uses [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/).

1. **Navigate to the frontend directory**
   ```sh
   cd frontend
   ```

2. **Install dependencies**
   If the project is already set up, simply run:
   ```sh
   npm install
   ```
   If you need to initialize a new Next.js app, run:
   ```sh
   npx create-next-app@latest .
   ```

3. **(If needed) Install Tailwind CSS and shadcn/ui**
   If not already set up, follow these steps:
   ```sh
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   npx shadcn-ui@latest init
   ```
   Configure as per the [Tailwind guide](https://tailwindcss.com/docs/guides/nextjs) and follow shadcn/ui prompts.

4. **Start the development server**
   ```sh
   npm run dev
   ```

Refer to the documentation for each tool for advanced configuration.

## Backend Setup

To run the Python backend using Gunicorn (from the `/backend` directory):

```sh
cd backend
gunicorn app:app
```
Replace `app:app` with the correct module and application name if different.

## Usage

<!-- ...existing code... -->
