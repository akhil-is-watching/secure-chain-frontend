"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// File type definition
type File = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  owner: string;
  shared: boolean;
  accessLevel: "view" | "edit" | "owner";
};

// Mock data for demonstration
const mockFiles: File[] = [
  {
    id: "1",
    name: "Research Paper.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadDate: "2023-11-15",
    owner: "You",
    shared: true,
    accessLevel: "owner",
  },
  {
    id: "2",
    name: "Financial_Report_Q3.xlsx",
    type: "xlsx",
    size: "1.8 MB",
    uploadDate: "2023-11-10",
    owner: "Sarah Johnson",
    shared: false,
    accessLevel: "view",
  },
  {
    id: "3",
    name: "Project_Proposal.docx",
    type: "docx",
    size: "3.2 MB",
    uploadDate: "2023-11-05",
    owner: "You",
    shared: true,
    accessLevel: "owner",
  },
  {
    id: "4",
    name: "Legal_Document.pdf",
    type: "pdf",
    size: "5.7 MB",
    uploadDate: "2023-10-28",
    owner: "Michael Chen",
    shared: false,
    accessLevel: "edit",
  },
  {
    id: "5",
    name: "Meeting_Notes.txt",
    type: "txt",
    size: "0.1 MB",
    uploadDate: "2023-10-20",
    owner: "You",
    shared: false,
    accessLevel: "owner",
  },
];

export default function Dashboard() {
  const [files, setFiles] = useState<File[]>(mockFiles);
  const [activeTab, setActiveTab] = useState<"all" | "shared" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadStage, setDownloadStage] = useState<"key" | "decrypt" | "complete">("key");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [shareEmail, setShareEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [encryptionStage, setEncryptionStage] = useState<"key" | "encrypt" | "complete">("key");
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [showSharingProcessModal, setShowSharingProcessModal] = useState(false);
  const [sharingStage, setSharingStage] = useState<"key" | "encrypt" | "complete">("key");
  const [sharingProgress, setSharingProgress] = useState(0);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStage, setVerifyStage] = useState<"hash" | "blockchain" | "complete">("hash");
  const [verifyProgress, setVerifyProgress] = useState(0);

  // Filter files based on active tab and search query
  const filteredFiles = files.filter((file) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "shared" && file.owner !== "You") ||
      (activeTab === "my" && file.owner === "You");
    
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Handle file upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileWithMetadata: File = {
        id: Date.now().toString(),
        name: file.name,
        type: file.name.split('.').pop() || "",
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        owner: "You",
        shared: false,
        accessLevel: "owner"
      };
      setFileToUpload(fileWithMetadata);
      setShowUploadModal(false);
      setShowEncryptionModal(true);
      setEncryptionStage("key");
      setEncryptionProgress(0);
      
      // Simulate encryption process
      setTimeout(() => {
        setEncryptionProgress(50);
        setEncryptionStage("encrypt");
        
        setTimeout(() => {
          // Add file to state
          const newFile: File = {
            id: Date.now().toString(),
            name: file.name,
            type: file.name.split('.').pop() || "",
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            uploadDate: new Date().toISOString().split('T')[0],
            owner: "You",
            shared: false,
            accessLevel: "owner",
          };
          
          setEncryptionProgress(100);
          setEncryptionStage("complete");
          
          // Close modal and reset after completion
          setTimeout(() => {
            setFiles([newFile, ...files]);
            setShowEncryptionModal(false);
            setFileToUpload(null);
            setEncryptionStage("key");
            setEncryptionProgress(0);
          }, 1000);
        }, 2000);
      }, 2000);
    }
  };

  // Handle file sharing
  const handleShare = () => {
    if (!selectedFile) return;
    
    setShowShareModal(false);
    setShowSharingProcessModal(true);
    setSharingStage("key");
    setSharingProgress(0);
    
    // Simulate key generation
    setTimeout(() => {
      setSharingProgress(50);
      setSharingStage("encrypt");
      
      // Simulate encryption and sharing process
      setTimeout(() => {
        // Update the shared status
        const updatedFiles = files.map((file) => {
          if (file.id === selectedFile.id) {
            return { ...file, shared: true };
          }
          return file;
        });
        
        setSharingProgress(100);
        setSharingStage("complete");
        
        // Close modal and reset after completion
        setTimeout(() => {
          setFiles(updatedFiles);
          setShowSharingProcessModal(false);
          setShareEmail("");
          setSelectedFile(null);
          setSharingStage("key");
          setSharingProgress(0);
        }, 1000);
      }, 2000);
    }, 2000);
  };

  // Handle file download with stages
  const handleDownload = (file: File) => {
    setSelectedFile(file);
    setDownloadStage("key");
    setDownloadProgress(0);
    setShowDownloadModal(true);
    
    // Simulate Diffie-Hellman key exchange
    setTimeout(() => {
      setDownloadProgress(50);
      setDownloadStage("decrypt");
      
      // Simulate decryption process
      setTimeout(() => {
        setDownloadProgress(100);
        setDownloadStage("complete");
        
        // Close modal and reset after completion
        setTimeout(() => {
          setShowDownloadModal(false);
          setSelectedFile(null);
          setDownloadStage("key");
          setDownloadProgress(0);
        }, 1000);
      }, 2000);
    }, 2000);
  };

  // Handle file verification
  const handleVerify = (file: File) => {
    setSelectedFile(file);
    setShowVerifyModal(true);
    setVerifyStage("hash");
    setVerifyProgress(0);
    
    // Simulate verification process
    setTimeout(() => {
      setVerifyProgress(50);
      setVerifyStage("blockchain");
      
      setTimeout(() => {
        setVerifyProgress(100);
        setVerifyStage("complete");
        
        // Close modal and reset after completion
        setTimeout(() => {
          setShowVerifyModal(false);
          setSelectedFile(null);
          setVerifyStage("hash");
          setVerifyProgress(0);
        }, 1000);
      }, 2000);
    }, 2000);
  };

  // Get icon based on file type
  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "./pdf.svg";
      case "docx":
      case "doc":
        return "./doc.svg";
      case "xlsx":
      case "xls":
        return "./xls.svg";
      case "txt":
        return "./txt.svg";
      default:
        return "./file.svg";
    }
  };

  const handleLogout = () => {
    // In a real app, you would also handle clearing auth tokens/session here
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="SecureChain Logo" 
              width={36} 
              height={36}
              className="rounded-lg bg-white/10 p-1"
            />
            <h1 className="text-xl font-bold">SecureChain</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search files..."
                className="bg-white/10 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-white/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-sm font-medium">JS</span>
                </div>
                <span className="text-sm font-medium">Qureshi Abraham</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("all")}
            >
              All Files
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "shared"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("shared")}
            >
              Shared with Me
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "my"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("my")}
            >
              My Files
            </button>
          </div>
          
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            onClick={() => setShowUploadModal(true)}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Upload File
          </button>
        </div>

        {/* Files Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                          <Image
                            src={getFileIcon(file.type)}
                            alt={file.type}
                            width={24}
                            height={24}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-500">.{file.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{file.owner}</div>
                      <div className="text-xs text-gray-500">
                        {file.shared ? "Shared" : "Private"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{file.uploadDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        file.accessLevel === "owner" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {file.accessLevel === "owner" ? "Owner" : "View only"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => handleVerify(file)}
                          title="Verify"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => handleDownload(file)}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        {file.owner === "You" && (
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => {
                              setSelectedFile(file);
                              setShowShareModal(true);
                            }}
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No files found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Upload File</h2>
            <p className="text-gray-600 mb-6">
              Files are encrypted and stored securely using IPFS and blockchain verification.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
              />
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your file here, or
              </p>
              <button
                type="button"
                className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium"
                onClick={() => fileInputRef.current?.click()}
              >
                browse files
              </button>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Share File</h2>
            <p className="text-gray-600 mb-6">
              Share "{selectedFile.name}" securely with others using end-to-end encryption.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter recipient's email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            
            <div className="mb-6">
              <p className="block text-sm font-medium text-gray-700 mb-1">
                Access Level
              </p>
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                View only (Recipients can view but not modify the document)
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                onClick={handleShare}
                disabled={!shareEmail}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal with Stages */}
      {showDownloadModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Secure Download</h2>
            <p className="text-gray-600 mb-6">
              Downloading "{selectedFile.name}" with end-to-end encryption
            </p>
            
            <div className="mb-6">
              {/* Progress bar */}
              <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              
              {/* Stages */}
              <div className="flex items-center mb-4">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  downloadStage === "key" 
                    ? "bg-indigo-600 text-white animate-pulse" 
                    : downloadStage === "decrypt" || downloadStage === "complete" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200"
                }`}>
                  {downloadStage === "key" ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-sm font-medium text-gray-900">Deriving Decryption Key</h3>
                  <p className="text-xs text-gray-500">Using Diffie-Hellman key exchange protocol</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  downloadStage === "decrypt" 
                    ? "bg-indigo-600 text-white animate-pulse" 
                    : downloadStage === "complete" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200"
                }`}>
                  {downloadStage === "decrypt" ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : downloadStage === "complete" ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <span className="text-gray-400">2</span>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-sm font-medium text-gray-900">Decrypting Document</h3>
                  <p className="text-xs text-gray-500">Using symmetric key for secure decryption</p>
                </div>
              </div>
            </div>
            
            {downloadStage === "complete" && (
              <div className="text-center text-green-600 font-medium">
                Download complete! File saved to your downloads folder.
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setShowDownloadModal(false);
                  setSelectedFile(null);
                }}
                disabled={downloadStage !== "complete"}
              >
                {downloadStage === "complete" ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encryption Modal */}
      {showEncryptionModal && fileToUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Secure Upload</h2>
            <p className="text-gray-600 mb-6">
              Encrypting "{fileToUpload.name}" for secure storage
            </p>
            
            <div className="mb-6">
              {/* Progress bar */}
              <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${encryptionProgress}%` }}
                ></div>
              </div>
              
              {/* Stages */}
              <div className="flex items-center mb-4">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  encryptionStage === "key" 
                    ? "bg-indigo-600 text-white animate-pulse" 
                    : encryptionStage === "encrypt" || encryptionStage === "complete" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200"
                }`}>
                  {encryptionStage === "key" ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-sm font-medium text-gray-900">Generating Encryption Key</h3>
                  <p className="text-xs text-gray-500">Using AES-256 encryption standard</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  encryptionStage === "encrypt" 
                    ? "bg-indigo-600 text-white animate-pulse" 
                    : encryptionStage === "complete" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200"
                }`}>
                  {encryptionStage === "encrypt" ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : encryptionStage === "complete" ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <span className="text-gray-400">2</span>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-sm font-medium text-gray-900">Encrypting File</h3>
                  <p className="text-xs text-gray-500">Preparing for secure storage</p>
                </div>
              </div>
            </div>
            
            {encryptionStage === "complete" && (
              <div className="text-center text-green-600 font-medium">
                Upload complete! File encrypted and stored securely.
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setShowEncryptionModal(false);
                  setFileToUpload(null);
                }}
                disabled={encryptionStage !== "complete"}
              >
                {encryptionStage === "complete" ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sharing Process Modal */}
      {showSharingProcessModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Secure Sharing</h2>
            <p className="text-gray-600 mb-6">
              Sharing "{selectedFile.name}" with {shareEmail}
            </p>
            
            <div className="mb-6">
              {/* Progress bar */}
              <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${sharingProgress}%` }}
                ></div>
              </div>
              
              {/* Stages */}
              <div className="flex items-center mb-4">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  sharingStage === "key" 
                    ? "bg-indigo-600 text-white animate-pulse" 
                    : sharingStage === "encrypt" || sharingStage === "complete" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200"
                }`}>
                  {sharingStage === "key" ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-sm font-medium text-gray-900">Generating Sharing Keys</h3>
                  <p className="text-xs text-gray-500">Creating secure access credentials</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  sharingStage === "encrypt" 
                    ? "bg-indigo-600 text-white animate-pulse" 
                    : sharingStage === "complete" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200"
                }`}>
                  {sharingStage === "encrypt" ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : sharingStage === "complete" ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <span className="text-gray-400">2</span>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-sm font-medium text-gray-900">Setting Up Access</h3>
                  <p className="text-xs text-gray-500">Configuring permissions and sending invitation</p>
                </div>
              </div>
            </div>
            
            {sharingStage === "complete" && (
              <div className="text-center text-green-600 font-medium">
                Share complete! An invitation has been sent to {shareEmail}.
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setShowSharingProcessModal(false);
                  setSelectedFile(null);
                }}
                disabled={sharingStage !== "complete"}
              >
                {sharingStage === "complete" ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Verify File Authenticity</h2>
            <p className="text-gray-600 mb-6">
              Verifying "{selectedFile.name}" on blockchain
            </p>
            
            <div className="mb-6">
              {/* Progress bar */}
              <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${verifyProgress}%` }}
                ></div>
              </div>
              
              {/* Stages */}
              <div className="flex items-center mb-4">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  verifyStage === "hash" 
                    ? "bg-indigo-600 text-white animate-pulse" 
                    : verifyStage === "blockchain" || verifyStage === "complete" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200"
                }`}>
                  {verifyStage === "hash" ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-sm font-medium text-gray-900">Computing File Hash</h3>
                  <p className="text-xs text-gray-500">Using SHA-256 hashing algorithm</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  verifyStage === "blockchain" 
                    ? "bg-indigo-600 text-white animate-pulse" 
                    : verifyStage === "complete" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200"
                }`}>
                  {verifyStage === "blockchain" ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : verifyStage === "complete" ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <span className="text-gray-400">2</span>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-sm font-medium text-gray-900">Verifying on Blockchain</h3>
                  <p className="text-xs text-gray-500">Checking file integrity and authenticity</p>
                </div>
              </div>
            </div>
            
            {verifyStage === "complete" && (
              <div className="text-center text-green-600 font-medium">
                Verification complete! File integrity confirmed on blockchain.
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedFile(null);
                }}
                disabled={verifyStage !== "complete"}
              >
                {verifyStage === "complete" ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
