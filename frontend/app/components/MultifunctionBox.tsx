'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import { Loader2 } from 'lucide-react'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter,
  DrawerClose
} from './ui/drawer'
import { toast } from 'sonner'; // Import toast for notifications

// Define sensor data interface
interface Sensor {
  _id: string
  model: string
  sensor_type: string
  manufacturer: string
  specifications?: {
    performance?: {
      torque_range?: string
    }
  }
}

interface SensorDetails extends Sensor {
  specifications: {
    performance: Record<string, string | null>
    electrical: Record<string, string | null>
    mechanical: Record<string, string | null>
    environmental: Record<string, string | null>
  }
  extra_fields: Record<string, string | null>
  source: {
    filename: string | null
    upload_date: string | null
    page_count: number | null
  }
}

type Mode = 'question' | 'upload' | 'result' | 'default' | 'loading' | 'sensor_details_display'

interface MultifunctionBoxProps {
  nextAction: string
  response: string
  onConfirm: (answer: string, autoConfirm?: boolean) => void
  selectedModel: string
}

// --- Helper Components ---

const LoadingIndicator: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="mt-2">Processing your request...</p>
  </div>
);

interface QuestionModeProps {
  response: string;
  onYes: () => void;
  onNo: () => void;
  disabled: boolean;
}

const QuestionModeContent: React.FC<QuestionModeProps> = ({ response, onYes, onNo, disabled }) => (
  <div>
    <p className="mb-2">
      <ReactMarkdown>{response}</ReactMarkdown>
    </p>
    <div className="flex gap-2 mt-2">
      <Button onClick={onYes} disabled={disabled} className="bg-green-600 hover:bg-green-700">Yes</Button>
      <Button onClick={onNo} disabled={disabled} className="bg-red-600 hover:bg-red-700">No</Button>
    </div>
  </div>
);

interface UploadModeProps {
  response: string;
  onFileUpload: (file: File) => void;
}

const UploadModeContent: React.FC<UploadModeProps> = ({ response, onFileUpload }) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadFile(e.target.files?.[0] || null);
    setUploadError(null);
  };

  const handleUploadClick = () => {
    if (!uploadFile) {
      setUploadError("Please select a PDF file first");
      return;
    }
    onFileUpload(uploadFile);
  };

  return (
    <div>
      <p className="mb-4">{response}</p>
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <Input type="file" accept=".pdf" onChange={handleFileChange} className="mb-2" />
        {uploadError && <p className="text-red-500 text-sm mb-2">{uploadError}</p>}
        <Button onClick={handleUploadClick} className="mt-2 w-full" disabled={!uploadFile}>
          Upload PDF
        </Button>
      </div>
    </div>
  );
};

interface ResultModeProps {
  result: string | null;
  onBack: () => void;
}

const ResultModeContent: React.FC<ResultModeProps> = ({ result, onBack }) => (
  <div>
    <h3 className="text-lg font-medium mb-2">Result:</h3>
    <div className="bg-green-50 p-4 border border-green-200 rounded-md mb-4">
      <p>{result}</p>
    </div>
    <Button onClick={onBack} className="mt-2">Back to Default</Button>
  </div>
);

interface DefaultModeProps {
  sensors: Sensor[];
  selectedModel: string;
  onSensorClick: (sensor: Sensor) => void;
  renderSensorDetailsDrawer: () => React.ReactNode;
}

const DefaultModeContent: React.FC<DefaultModeProps> = ({ sensors, selectedModel, onSensorClick, renderSensorDetailsDrawer }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">Available Sensors</h3>
    {Array.isArray(sensors) && sensors.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sensors.map((sensor) => (
          <div 
            key={sensor._id} 
            onClick={() => onSensorClick(sensor)}
            className="border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-bold">{sensor.model || "Unknown Model"}</h4>
            <p className="text-sm text-gray-600">{sensor.sensor_type || "Unknown Type"}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs">{sensor.manufacturer || "Unknown Manufacturer"}</span>
              {sensor.specifications?.performance?.torque_range && (
                <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                  {sensor.specifications.performance.torque_range}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="border rounded-md p-4 text-center bg-gray-50">
        <p>No sensors found in the database.</p>
        <p className="text-sm text-gray-500 mt-1">Upload a sensor datasheet to get started!</p>
      </div>
    )}
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <p>Ask about a sensor setup to get started!</p>
      <p className="text-sm mt-1 text-gray-600">
        Current model: <span className="font-medium">{selectedModel.split('/').pop()}</span>
      </p>
    </div>
    {renderSensorDetailsDrawer()}
  </div>
);

interface SensorDetailsDrawerProps {
  sensor: SensorDetails | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SensorDetailsDrawer: React.FC<SensorDetailsDrawerProps> = ({ sensor, isOpen, onOpenChange }) => {
  if (!sensor) return null;

  const renderSection = (title: string, data: Record<string, string | null> | undefined) => {
    if (!data || Object.keys(data).length === 0) return null;
    return (
      <section>
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="border-b pb-1">
              <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {value || 'N/A'}
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} direction="right">
      <DrawerContent>
        <div className="mx-auto w-full max-w-md p-4">
          <DrawerHeader className="px-0 pt-0">
            <DrawerTitle>{sensor.model} - {sensor.sensor_type}</DrawerTitle>
            <DrawerDescription>{sensor.manufacturer}</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-4 pb-4">
              {renderSection('Performance', sensor.specifications.performance)}
              {renderSection('Electrical', sensor.specifications.electrical)}
              {renderSection('Mechanical', sensor.specifications.mechanical)}
              {renderSection('Environmental', sensor.specifications.environmental)}
              {renderSection('Additional Information', sensor.extra_fields)}
              
              <section>
                <h3 className="text-lg font-semibold">Source</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border-b pb-1">
                    <span className="font-medium">Filename:</span> {sensor.source?.filename || 'N/A'}
                  </div>
                  <div className="border-b pb-1">
                    <span className="font-medium">Upload Date:</span> {sensor.source?.upload_date 
                      ? new Date(sensor.source.upload_date).toLocaleDateString() 
                      : 'N/A'}
                  </div>
                  <div className="border-b pb-1">
                    <span className="font-medium">Page Count:</span> {sensor.source?.page_count || 'N/A'}
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
          <DrawerFooter className="px-0 pb-0">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};


// --- Main Component ---

export default function MultifunctionBox({ 
  nextAction, 
  response, 
  onConfirm, 
  selectedModel 
}: Omit<MultifunctionBoxProps, 'onUpload'>) { // Adjust props type
  const [mode, setMode] = useState<Mode>('default');
  const [result, setResult] = useState<string | null>(null);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensorDetails, setSelectedSensorDetails] = useState<SensorDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Fetch sensors on initial load and when needed
  const fetchSensors = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/sensors`);
      if (!res.ok) throw new Error('Failed to fetch sensors');
      const data = await res.json();
      console.log("Fetched sensors:", data); // Debug: log the fetched data
      
      // Ensure we have an array of sensors
      if (data && data.sensors && Array.isArray(data.sensors)) {
        setSensors(data.sensors);
      } else {
        console.error("Invalid sensor data format:", data);
        setSensors([]);
        toast.error("Received invalid sensor data format from server");
      }
    } catch (error) {
      console.error('Error fetching sensors:', error);
      toast.error("Failed to load sensor list.");
      setSensors([]); // Set empty array on error
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);
  
  // Fetch sensor details
  const fetchSensorDetails = useCallback(async (model: string) => {
    setIsLoading(true); 
    setDrawerOpen(false); 
    try {
      const res = await fetch(`${apiUrl}/api/sensors/${model}`);
      if (!res.ok) {
        if (res.status === 404) {
           toast.error(`Sensor details not found for model: ${model}`);
        } else {
           throw new Error(`Failed to fetch sensor details for ${model}`);
        }
        setSelectedSensorDetails(null); // Clear details on error
      } else {
        const data = await res.json();
        setSelectedSensorDetails(data);
        setDrawerOpen(true); 
      }
      setMode('default'); 
    } catch (error) {
      console.error('Error fetching sensor details:', error);
      toast.error("Error fetching sensor details."); // Use toast
      setSelectedSensorDetails(null); // Clear details on error
    } finally {
      setIsLoading(false); 
    }
  }, [apiUrl]);

  // Update mode based on nextAction and response
  useEffect(() => {
    console.log(`MultifunctionBox: nextAction changed to '${nextAction}', response: '${response.substring(0, 50)}...'`);
    
    // Reset loading state unless explicitly set to loading or mode is upload (handled separately)
    if (nextAction !== 'loading' && mode !== 'upload') {
       setIsLoading(false);
    }

    switch (nextAction) {
      case 'confirm_sensor':
        setMode('question');
        break;
      case 'pdf_upload':
        setMode('upload');
        // Clear any previous result when prompting for upload
        setResult(null); 
        break;
      case 'none':
        // Specific handling for 'none' action - ensure we go back to default
        setMode('default');
        break;
      default:
        // Only switch to default if not currently loading or in upload mode
        if (!isLoading && mode !== 'upload') { 
          setMode('default');
        }
    }

    // ... existing response override logic ...
  }, [nextAction, response, isLoading, mode]); // Add isLoading and mode to dependencies

  // --- Event Handlers ---

  // Enhanced file upload handler with better feedback
  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setMode('loading');
    const formData = new FormData();
    formData.append('file', file);
    // Add the current model to the request
    formData.append('model', selectedModel);

    try {
      const res = await fetch(`${apiUrl}/api/pdf/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Failed to upload PDF (${res.status})`);
      }

      console.log("Upload successful:", data);
      
      // Check if we got meaningful extraction data
      const hasExtractedData = data.processed_model && 
                              ((data.manufacturer && data.sensor_type) || 
                               Object.keys(data.specifications?.performance || {}).length > 0);
      
      if (hasExtractedData) {
        toast.success(`Successfully extracted data for ${data.processed_model}`);
      } else {
        // Show warning if extraction was limited
        toast.warning(`Upload successful, but limited data was extracted. Consider uploading a clearer PDF.`);
      }
      
      // Always refresh the sensor list regardless of extraction quality
      await fetchSensors();
      
      // Always go back to default state after upload completes
      setMode('default');

    } catch (error: any) {
      console.error("Error during file upload:", error);
      toast.error(`Upload failed: ${error.message}`);
      setMode('default');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, fetchSensors, selectedModel]);

  const handleConfirm = useCallback((answer: 'yes' | 'no', autoConfirm?: boolean) => {
    // ... existing confirmation logic ...
    // Ensure isLoading is set true here as well
    if (!buttonsDisabled) {
      setButtonsDisabled(true);
      setIsLoading(true); 
      onConfirm(answer, autoConfirm);
      setTimeout(() => setButtonsDisabled(false), 1500); 
    }
  }, [onConfirm, buttonsDisabled]);

  // Add missing handler functions
  const handleSensorClick = useCallback((sensor: Sensor) => {
    fetchSensorDetails(sensor.model);
  }, [fetchSensorDetails]);

  const handleSetModeDefault = useCallback(() => {
    setMode('default');
    setResult(null); // Clear result when going back to default
  }, []);

  // --- Render Logic ---
  
  const renderSensorDetailsDrawer = () => (
    <SensorDetailsDrawer
      sensor={selectedSensorDetails}
      isOpen={drawerOpen}
      onOpenChange={setDrawerOpen}
    />
  );

  const renderCurrentMode = () => {
    // Show loading indicator if isLoading is true, regardless of the underlying mode
    if (isLoading) {
      return <LoadingIndicator />;
    }

    switch (mode) {
      case 'question':
        return (
          <QuestionModeContent
            response={response}
            onYes={() => handleConfirm('yes')}
            onNo={() => handleConfirm('no')}
            disabled={buttonsDisabled}
          />
        );
      case 'result':
        return <ResultModeContent result={result} onBack={handleSetModeDefault} />;
      case 'upload':
        // Pass the internal handleFileUpload function to the component
        return <UploadModeContent 
                  response={response} 
                  onFileUpload={handleFileUpload} 
                />;
      case 'default':
      default:
        return (
          <DefaultModeContent
            sensors={sensors}
            selectedModel={selectedModel}
            onSensorClick={handleSensorClick}
            renderSensorDetailsDrawer={renderSensorDetailsDrawer}
          />
        );
    }
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle>Multifunction Box</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100vh-140px)]">
        <ScrollArea className="h-full p-4 border rounded-md">
          {renderCurrentMode()}
        </ScrollArea>
      </CardContent>
    </>
  );
}