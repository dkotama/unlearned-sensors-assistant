# Feature Specification: Sensor Datasheet Processing Project

## 1. Project Overview

This project aims to create a Python-based system that processes unstructured PDF sensor datasheets, chunks them by page, extracts structured data using generative AI, and stores the data in MongoDB for display on a frontend. The frontend includes a "Multibox Default State" page to list saved devices using card components (based on Shadcn UI) and a right drawer to show detailed sensor information upon card selection. The system ensures flexibility by allowing nullable fields to accommodate incomplete or variable datasheet information.

### 1.1 Objectives

- **PDF Processing**: Load and chunk PDF datasheets by page to handle large documents efficiently.
- **Data Extraction**: Use generative AI to convert unstructured text into structured JSON data.
- **Data Storage**: Store structured data in MongoDB with a flexible schema supporting nullable fields.
- **Frontend Display**: Render a list of devices on the "Multibox Default State" page using Shadcn card components and display detailed sensor data in a right drawer.
- **Flexibility**: Support varied datasheet formats and incomplete data through nullable fields.
- **Scalability**: Design for batch processing of multiple PDFs and efficient frontend rendering.

### 1.2 Scope

- **In Scope**:
  - PDF loading and page-based chunking using Langchain.
  - Structured data extraction with generative AI (e.g., OpenAI or open-source models).
  - MongoDB storage with a flexible schema.
  - Frontend implementation with Shadcn card components and a right drawer for details.
  - Placeholder for the "Multibox Default State" page.
- **Out of Scope**:
  - Embedding generation and vector search (as per user request).
  - Real-time PDF uploads via the frontend.
  - Advanced data analytics or visualization beyond basic display.

## 2. Functional Requirements

### 2.1 PDF Processing and Chunking

- **Feature**: Load PDF datasheets and chunk them by page.
- **Description**: The system will use Langchain’s `PyPDFLoader` to load PDF files and split them into individual pages for processing. Each page will be treated as a separate document to ensure manageable text sizes for generative AI extraction.
- **Details**:
  - Supported file format: PDF.
  - Chunking strategy: One document per page to preserve context (e.g., a page may contain a complete section like "Performance Characteristics").
  - Error handling: Handle corrupted or unreadable PDFs with user-friendly error messages.
  - Metadata: Store PDF filename and page number as metadata for traceability.
- **Implementation**:
  - Use `langchain.document_loaders.PyPDFLoader` to load PDFs.
  - Extract text and metadata (e.g., page number) for each page.
  - Save raw page content temporarily for processing.
- **Example**:
  - Input: `f98010f6-9544-4872-9be1-27cf47cda1ab.pdf` (4 pages).
  - Output: 4 documents, each containing the text of one page and metadata (e.g., `filename`, `page_number`).

### 2.2 Structured Data Extraction

- **Feature**: Extract structured data from page chunks using generative AI.
- **Description**: Process each page’s text using a generative AI model (e.g., OpenAI’s ChatGPT or an open-source model like LLaMA) to extract structured data based on a predefined schema. The schema includes nullable fields to handle missing or incomplete information.
- **Details**:
  - Schema: Define a Pydantic model with fields for common sensor attributes (e.g., `sensor_type`, `torque_range`) and nullable fields for optional data.
  - AI Prompt: Use a prompt that instructs the AI to extract data into JSON format, handling missing data by setting fields to `null`.
  - Validation: Implement rule-based checks to ensure extracted data matches expected formats (e.g., torque range includes units like "Nm").
  - Merging: Combine data from all pages of a single PDF into one MongoDB document, resolving duplicates or conflicts (e.g., if `model` appears on multiple pages).
- **Implementation**:
  - Use Langchain’s `JsonOutputParser` with a Pydantic schema.
  - Chain the AI model with a prompt template to extract data.
  - Validate extracted JSON (e.g., check for valid units, non-negative values).
  - Merge page-level data into a single document, prioritizing later pages for conflicting fields.
- **Example**:
  - Input: Page 1 text: "Dataset: SMART SERVO S-1000 High Precision Servo Motor... Torque Range: 0.5 Nm - 15 Nm".
  - Output: JSON snippet: `{"model": "S-1000", "specifications": {"performance": {"torque_range": "0.5 Nm to 15 Nm"}}}`.

### 2.3 MongoDB Storage

- **Feature**: Store structured data in MongoDB with a flexible schema.
- **Description**: Save extracted data in a MongoDB collection with a schema that supports nullable fields and accommodates varied sensor types. Include metadata for traceability.
- **Details**:
  - Collection: `sensor_specifications`.
  - Schema: Include core fields, categorized specifications, and an `extra_fields` object for additional data. All fields except `_id`, `sensor_type`, `manufacturer`, and `model` are nullable.
  - Metadata: Store PDF filename, upload date, and page count.
  - Indexing: Create indexes on `model` and `sensor_type` for fast queries.
- **Implementation**:
  - Use PyMongo to connect to MongoDB and insert/update documents.
  - Validate data before insertion (e.g., ensure required fields are present).
  - Handle duplicates by checking for existing `model` values.
- **Example Schema** (with nullable fields):

  ```json
  {
    "_id": ObjectId,
    "sensor_type": String,  // Required, e.g., "Servo Motor"
    "manufacturer": String,  // Required, e.g., "RoboTech Industries"
    "model": String,  // Required, e.g., "S-1000"
    "specifications": {
      "performance": {
        "torque_range": String || null,  // e.g., "0.5 Nm to 15 Nm" or null
        "speed": String || null,  // e.g., "0 to 3000 RPM" or null
        "accuracy": String || null,  // e.g., "±0.02°" or null
        "precision": String || null,
        "resolution": String || null,
        // Other nullable performance metrics
      },
      "electrical": {
        "power_supply": String || null,  // e.g., "12V DC (±5%), 1.5A max" or null
        "control_voltage": String || null,
        "output_type": String || null,
        // Other nullable electrical specs
      },
      "mechanical": {
        "dimensions": String || null,  // e.g., "55 mm x 45 mm x 100 mm" or null
        "weight": String || null,  // e.g., "350 g" or null
        "mounting_options": [String] || null,  // e.g., ["Standard flange"] or null
        // Other nullable mechanical specs
      },
      "environmental": {
        "operating_temp": String || null,  // e.g., "-20°C to 80°C" or null
        "storage_temp": String || null,
        "environmental_ratings": String || null,  // e.g., "IP68" or null
        // Other nullable environmental specs
      }
    },
    "extra_fields": {
      // Flexible key-value pairs for additional data, e.g., "lifetime": "20,000 operating hours" or null
    },
    "source": {
      "filename": String || null,  // e.g., "f98010f6-9544-4872-9be1-27cf47cda1ab.pdf"
      "upload_date": Date || null,  // e.g., ISODate("2025-04-21T15:02:00Z")
      "page_count": Number || null  // e.g., 4
    }
  }
  ```

### 2.4 Frontend: Multibox Default State Page

- **Feature**: Display a list of saved devices using Shadcn card components.
- **Description**: The "Multibox Default State" page serves as the main interface to view all sensors stored in MongoDB. Each sensor is displayed as a card (using Shadcn UI’s card component), showing key details like model and sensor type.
- **Details**:
  - Layout: Grid of cards, responsive for different screen sizes (e.g., 1 column on mobile, 3 columns on desktop).
  - Card Content: Display `model`, `sensor_type`, `manufacturer`, and a brief spec (e.g., `torque_range` if available).
  - Interactivity: Clicking a card opens a right drawer with detailed sensor information.
  - Pagination: Support pagination or infinite scrolling for large datasets (e.g., 20 cards per page).
  - Filtering: Optional filters for `sensor_type` or `manufacturer` (future enhancement).
- **Implementation** (General Idea):
  - Use React with Shadcn UI for the frontend.
  - Fetch sensor data from a backend API (e.g., Flask or FastAPI).
  - Render cards using Shadcn’s `Card` component.
  - Example card structure:

    ```jsx
    <Card>
      <CardHeader>
        <CardTitle>S-1000</CardTitle>
        <CardDescription>Servo Motor</CardDescription>
      </CardHeader>
      <CardContent>
        <p><strong>Manufacturer:</strong> RoboTech Industries</p>
        <p><strong>Torque Range:</strong> 0.5 Nm to 15 Nm</p>
      </CardContent>
    </Card>
    ```
- **Placeholder Notes**:
  - The "Multibox Default State" page is a placeholder for the device list.
  - Assume Shadcn UI is installed via npm (`npm install @shadcn/ui`).
  - Styling uses Tailwind CSS (included in Shadcn setup).

### 2.5 Frontend: Right Drawer for Sensor Details

- **Feature**: Display detailed sensor information in a right drawer.
- **Description**: When a user clicks a card on the "Multibox Default State" page, a right drawer slides in from the right, showing all available sensor details, including nullable fields and `extra_fields`.
- **Details**:
  - Trigger: Card click event.
  - Content: Organized sections for `sensor_type`, `manufacturer`, `model`, `specifications` (performance, electrical, mechanical, environmental), and `extra_fields`.
  - Nullable Handling: Display "N/A" or skip fields with `null` values.
  - Styling: Use Shadcn’s `Drawer` component with Tailwind CSS for a clean, modern look.
  - Interactivity: Include a close button to dismiss the drawer.
  - Responsive Design: Ensure the drawer is usable on mobile (e.g., full-screen on small devices).
- **Implementation** (General Idea):
  - Use Shadcn’s `Drawer` component to manage the drawer state.
  - Fetch detailed sensor data via an API endpoint (e.g., `/sensor/<model>`).
  - Dynamically render fields, including `extra_fields`, using a loop.
  - Example drawer structure:

    ```jsx
    <Drawer>
      <DrawerTrigger>
        {/* Card click triggers drawer */}
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerHeader>
          <DrawerTitle>S-1000 - Servo Motor</DrawerTitle>
          <DrawerDescription>RoboTech Industries</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <h3>Performance</h3>
          <p><strong>Torque Range:</strong> {data.specifications.performance.torque_range || "N/A"}</p>
          <h3>Electrical</h3>
          <p><strong>Power Supply:</strong> {data.specifications.electrical.power_supply || "N/A"}</p>
          <h3>Extra Fields</h3>
          {Object.entries(data.extra_fields).map(([key, value]) => (
            <p key={key}><strong>{key}:</strong> {value || "N/A"}</p>
          ))}
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    ```

## 3. Non-Functional Requirements

### 3.5 Maintainability

- Modular code structure with separate modules for PDF processing, data extraction, MongoDB storage, and frontend components

## 4. Technical Architecture

### 4.1 Backend

- **Database**: MongoDB atlas
- **PDF Processing**:
  - `PyPDFLoader` for loading and chunking PDFs.
  - Page-based chunking to preserve section context.
- **Data Extraction**:
  - Langchain chain with `PromptTemplate`, AI model, and `JsonOutputParser`.
  - Rule-based validation for extracted JSON.
- **API Endpoints**:
  - `GET /sensors`: List all sensors (paginated).
  - `GET /sensor/<model>`: Get detailed sensor data by model.
  - `POST /process-pdf`: (Future) Upload and process a PDF.