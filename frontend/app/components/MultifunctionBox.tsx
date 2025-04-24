'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import { Loader2, RotateCcw } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from './ui/drawer'
import { useToast } from "@/app/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Label } from "@/app/components/ui/label";


// --- Interfaces ---
interface ModelOption {
    id: string;
    name: string;
}

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
  selectedModel: string
  onConfirm: (answer: 'yes' | 'no') => void
  models: ModelOption[]
  onModelChange: (modelId: string) => void
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
  isLoading: boolean;
}

const UploadModeContent: React.FC<UploadModeProps> = ({ response, onFileUpload, isLoading }) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    if (file) {
        setUploadError(null);
    } else {
        setUploadError("Please select a PDF file.");
    }
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
        <Input type="file" accept=".pdf" onChange={handleFileChange} className="mb-2" disabled={isLoading}/>
        {uploadError && <p className="text-red-500 text-sm mb-2">{uploadError}</p>}
        <Button onClick={handleUploadClick} className="mt-2 w-full" disabled={!uploadFile || isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : 'Upload PDF'}
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
      <p>{result || "No result data available."}</p>
    </div>
    <Button onClick={onBack} className="mt-2">Back to Default</Button>
  </div>
);

interface DefaultModeProps {
  sensors: Sensor[];
  onSensorClick: (sensor: Sensor) => void;
  isLoading: boolean;
  onRefresh?: () => void;
  apiUrl: string;
}

const DefaultModeContent: React.FC<DefaultModeProps> = ({ sensors, onSensorClick, isLoading, onRefresh, apiUrl }) => {
  return (
  <div>
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-semibold">Available Sensors</h3>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              // First try the DB debug endpoint
              const dbResponse = await fetch(`${apiUrl}/api/v1/db-debug`);
              const dbData = await dbResponse.json();
              console.log("DB Debug data:", dbData);
              
              // Then try the sensors endpoint directly
              const sensorResponse = await fetch(`${apiUrl}/api/v1/sensors`);
              const sensorData = await sensorResponse.json();
              console.log("Direct sensors request:", sensorData);
              
              alert(`DB test: ${dbResponse.ok ? 'OK' : 'Failed'}\nSensors test: ${sensorResponse.ok ? 'OK' : 'Failed'}\nSee console for details`);
            } catch (error: any) {
              console.error("DB test error:", error);
              alert(`Error testing DB: ${error?.message || 'Unknown error'}`);
            }
          }}
          className="text-xs"
        >
          Test DB
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />}
          Refresh
        </Button>
      </div>
    </div>
    {isLoading && sensors.length === 0 && (
        <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
    )}
    {!isLoading && Array.isArray(sensors) && sensors.length > 0 ? (
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
    ) : (!isLoading && (
      <div className="border rounded-md p-4 text-center bg-gray-50">
        <p>No sensors found in the database.</p>
        <p className="text-sm text-gray-500 mt-1">Upload a sensor datasheet to get started!</p>
      </div>
    ))}
  </div>
  );
};

interface SensorDetailsDrawerProps {
  sensor: SensorDetails | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SensorDetailsDrawer: React.FC<SensorDetailsDrawerProps> = ({ sensor, isOpen, onOpenChange }) => {
  if (!sensor) return null;

  const renderSection = (title: string, data: Record<string, string | null> | undefined) => {
    if (!data) return null;
    const entries = Object.entries(data).filter(([_, value]) => value !== null && value !== undefined && value !== '');
    if (entries.length === 0) return null;
    return (
      <section className="mb-4">
        <h3 className="text-md font-semibold mb-2 border-b pb-1">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {entries.map(([key, value]) => (
            <div key={key}>
              <span className="font-medium text-gray-700">{key.replace(/_/g, ' ').replace(/ \w/g, l => l.toUpperCase())}:</span>
              <span className="text-gray-900 ml-1">{value}</span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="w-full max-w-lg">
        <div className="p-4 h-screen flex flex-col">
          <DrawerHeader className="px-0 pt-0 pb-2 border-b mb-4">
            <DrawerTitle>{sensor.model || "Sensor Details"}</DrawerTitle>
            <DrawerDescription>{sensor.manufacturer} - {sensor.sensor_type}</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 mb-4">
            {renderSection('Performance', sensor.specifications.performance)}
            {renderSection('Electrical', sensor.specifications.electrical)}
            {renderSection('Mechanical', sensor.specifications.mechanical)}
            {renderSection('Environmental', sensor.specifications.environmental)}
            {renderSection('Additional Information', sensor.extra_fields)}

            <section>
              <h3 className="text-md font-semibold mb-2 border-b pb-1">Source</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="font-medium text-gray-700">Filename:</span> <span className="text-gray-900 ml-1">{sensor.source?.filename || 'N/A'}</span></div>
                  <div><span className="font-medium text-gray-700">Upload Date:</span> <span className="text-gray-900 ml-1">{sensor.source?.upload_date ? new Date(sensor.source.upload_date).toLocaleDateString() : 'N/A'}</span></div>
                  <div><span className="font-medium text-gray-700">Page Count:</span> <span className="text-gray-900 ml-1">{sensor.source?.page_count || 'N/A'}</span></div>
              </div>
            </section>
          </ScrollArea>
          <DrawerFooter className="px-0 pb-0 mt-auto">
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
  selectedModel,
  models,
  onModelChange
}: MultifunctionBoxProps) {
  const [mode, setMode] = useState<Mode>('default');
  const [result, setResult] = useState<string | null>(null);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSensorsLoading, setIsSensorsLoading] = useState(true);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensorDetails, setSelectedSensorDetails] = useState<SensorDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();
  const hasFetchedSensors = useRef(false);

  // Use the same URL construction logic as in ChatInterface
  const isCloudWorkstations = process.env.NEXT_PUBLIC_CLOUD_WORKSTATIONS === 'true';
  const defaultApiUrl = 'http://localhost:8000';
  let apiUrl = defaultApiUrl;
  
  if (isCloudWorkstations) {
    try {
      // First try to get from window.location if we're in the browser
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Replace the port part in the hostname
        apiUrl = `https://${hostname.replace(/^[^-]+-/, '8000-')}`;
        console.log(`%cMultifunctionBox: Constructed Cloud Workstations API URL: ${apiUrl}`, 'color: blue; font-weight: bold;');
      } else {
        // Fallback to env var if not in browser
        apiUrl = process.env.NEXT_PUBLIC_CLOUD_API_URL || '';
        console.log(`%cMultifunctionBox: Using environment variable API URL: ${apiUrl}`, 'color: blue;');
      }
    } catch (e) {
      console.error('Error constructing Cloud Workstations URL:', e);
      // Fallback to env var
      apiUrl = process.env.NEXT_PUBLIC_CLOUD_API_URL || '';
    }
  } else {
    console.log(`%cMultifunctionBox: Using local API URL: ${apiUrl}`, 'color: blue;');
  }

  console.log(`%cMultifunctionBox rendering/mounting... Mode: ${mode}, NextAction: ${nextAction}`, 'color: orange;');
  
  useEffect(() => {
    console.log(`%cMultifunctionBox: API URL is: ${apiUrl}`, 'color: lightblue;');
  }, [apiUrl]);

  const fetchSensors = useCallback(async () => {
    console.log(`%cMultifunctionBox: Attempting to fetch sensors. API URL: ${apiUrl}`);
    setIsSensorsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/sensors`, { credentials: 'include' });
      console.log(`%cMultifunctionBox: Fetch response status: ${res.status}`);
      if (res.status === 404) {
        console.warn(`MultifunctionBox: /api/v1/sensors endpoint not found (404). API URL used: ${apiUrl}`);
        setSensors([]);
      } else if (!res.ok) {
        throw new Error(`Failed to fetch sensors (${res.status})`);
      } else {
        const data = await res.json();
        if (data && data.sensors && Array.isArray(data.sensors)) {
          setSensors(data.sensors);
          console.log(`%cMultifunctionBox: Successfully fetched ${data.sensors.length} sensors.`);
        } else {
          console.error("Invalid sensor data format:", data);
          setSensors([]);
          toast({ title: "Error", description: "Received invalid sensor data format.", variant: "destructive" });
        }
      }
    } catch (error: any) {
      console.error('Error fetching sensors:', error);
      toast({ title: "Error", description: `Failed to load sensor list: ${error.message}`, variant: "destructive" });
      setSensors([]);
    } finally {
      setIsSensorsLoading(false);
    }
  }, [apiUrl, toast]);

  // useEffect to fetch sensors ONLY ONCE per mount
  useEffect(() => {
    console.log(`%cMultifunctionBox: Sensor fetch effect running. Has fetched: ${hasFetchedSensors.current}`, 'color: cyan;');
    if (!hasFetchedSensors.current) {
      console.log("%cMultifunctionBox: Initial sensor fetch triggered.", 'color: yellow; font-weight: bold;');
      fetchSensors();
      hasFetchedSensors.current = true;
    }
    return () => {
      console.log("%cMultifunctionBox unmounting...", 'color: red;');
    };
  }, [fetchSensors]);

  const fetchSensorDetails = useCallback(async (model: string) => {
    console.log(`MultifunctionBox: Fetching details for ${model}...`);
    setIsLoading(true);
    setSelectedSensorDetails(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/sensor/${model}`, { credentials: 'include' });
      if (!res.ok) {
        const errorText = await res.text();
        if (res.status === 404) {
           toast({ title: "Not Found", description: `Sensor details not found for model: ${model}`, variant: "destructive" });
        } else {
           throw new Error(`Failed to fetch sensor details for ${model} (${res.status}): ${errorText}`);
        }
      } else {
        const data = await res.json();
        setSelectedSensorDetails(data);
        setDrawerOpen(true);
        console.log(`MultifunctionBox: Details loaded for ${model}.`);
      }
    } catch (error: any) {
      console.error('Error fetching sensor details:', error);
      toast({ title: "Error", description: `Error fetching sensor details: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, toast]);

  // useEffect to sync mode based on parent state
  useEffect(() => {
    console.log(`%cMultifunctionBox: Syncing mode effect. nextAction='${nextAction}', current mode='${mode}'`, 'color: magenta;');
    if (!isFileUploading) {
        setIsLoading(false);
    }
    setButtonsDisabled(false);

    switch (nextAction) {
      case 'confirm_sensor':
      case 'confirm':
        setMode('question');
        break;
      case 'pdf_upload':
        setMode('upload');
        setResult(null);
        break;
      case 'none':
      default:
        if (!isFileUploading && !isLoading && !drawerOpen) {
             setMode('default');
        }
        break;
    }
  }, [nextAction, drawerOpen, isLoading, isFileUploading]);

  const handleFileUpload = useCallback(async (file: File) => {
    console.log(`MultifunctionBox: Uploading file ${file.name}...`);
    setIsFileUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', selectedModel);

    try {
      const res = await fetch(`${apiUrl}/api/v1/pdf/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to upload PDF (${res.status})`);
      }
      console.log("Upload successful:", data);
      toast({ title: "Upload Successful", description: `Processed ${data.processed_model || file.name}.` });
      // Reset flag to allow re-fetch after successful upload
      console.log("%cMultifunctionBox: Resetting fetch flag for post-upload refresh.", 'color: yellow;');
      hasFetchedSensors.current = false;
      // Clear the upload mode but don't directly set to default yet
      console.log("%cMultifunctionBox: File upload successful, resetting UI state", 'color: green; font-weight: bold;');
      
      // Fetch the updated sensors list
      await fetchSensors();
      hasFetchedSensors.current = true;
      
      // Force UI reset by explicitly setting isFileUploading to false first
      setIsFileUploading(false);
      // Then explicitly force mode to default
      setMode('default');
    } catch (error: any) {
      console.error("Error during file upload:", error);
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsFileUploading(false);
    }
  }, [apiUrl, fetchSensors, selectedModel, toast]);

  const handleConfirmationResponse = useCallback((answer: 'yes' | 'no') => {
    if (!buttonsDisabled) {
      console.log(`MultifunctionBox: Confirmation response: ${answer}`);
      setButtonsDisabled(true);
      onConfirm(answer);
      setTimeout(() => setButtonsDisabled(false), 1500);
    }
  }, [onConfirm, buttonsDisabled]);

  const handleSensorClick = useCallback((sensor: Sensor) => {
    fetchSensorDetails(sensor.model);
  }, [fetchSensorDetails]);

  const handleSetModeDefault = useCallback(() => {
    setMode('default');
    setResult(null);
  }, []);

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setSelectedSensorDetails(null);
      if (mode !== 'upload' && mode !== 'question') {
        setMode('default');
      }
    }
  }, [mode]);

  const renderSensorDetailsDrawerInstance = () => (
    <SensorDetailsDrawer
      sensor={selectedSensorDetails}
      isOpen={drawerOpen}
      onOpenChange={handleDrawerOpenChange}
    />
  );

  const renderCurrentMode = () => {
    if (isSensorsLoading && mode === 'default' && !sensors.length) { // Show loading only in default mode initially if no sensors are loaded yet
        return <LoadingIndicator />;
    }
    if (isLoading && !isFileUploading) {
      return <LoadingIndicator />;
    }

    switch (mode) {
      case 'question':
        return (
          <QuestionModeContent
            response={response}
            onYes={() => handleConfirmationResponse('yes')}
            onNo={() => handleConfirmationResponse('no')}
            disabled={buttonsDisabled}
          />
        );
      case 'result':
        return <ResultModeContent result={result} onBack={handleSetModeDefault} />;
      case 'upload':
        return <UploadModeContent
                  response={response}
                  onFileUpload={handleFileUpload}
                  isLoading={isFileUploading}
                />;
      case 'default':
      default:
        return (
          <DefaultModeContent
            sensors={sensors}
            onSensorClick={handleSensorClick}
            isLoading={isSensorsLoading} // Pass loading state still
            apiUrl={apiUrl} // Pass the apiUrl to the component
            onRefresh={() => {
              console.log("%cMultifunctionBox: Manual refresh triggered", 'color: yellow; font-weight: bold;');
              hasFetchedSensors.current = false; // Reset the fetch flag
              fetchSensors(); // Trigger a new fetch
              hasFetchedSensors.current = true; // Set the flag back to true after fetch
            }}
          />
        );
    }
  };

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-2 flex flex-row justify-between items-center">
          <CardTitle>Sensor Information</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden py-0 px-0">
          <ScrollArea className="h-full w-full p-4">
            {renderCurrentMode()}
          </ScrollArea>
        </CardContent>
      </Card>
      {renderSensorDetailsDrawerInstance()}
    </>
  );
}
