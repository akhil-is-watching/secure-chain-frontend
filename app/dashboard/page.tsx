"use client";

import CryptoJS, { AES, SHA256 } from 'crypto-js';
import { ec } from 'elliptic';
import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PinataSDK } from "pinata";
import { useEffect, useRef, useState } from "react";
import registryABI from "../abi.json";
// File type definition - rename to FileItem to avoid conflict with browser's File type
type FileItem = {
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
const mockFiles: FileItem[] = [
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



// Registry contract address - replace with your deployed contract address
const REGISTRY_CONTRACT_ADDRESS = "0xDFd7F57D78c1d90Fbc9fC6B4ac8E62D45ce47f82"; // Replace with actual contract address

// Add this type declaration at the top of your file, after your imports
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (eventName: string) => void;
    };
  }
}

export default function Dashboard() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [activeTab, setActiveTab] = useState<"all" | "shared" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
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
  const [fileToUpload, setFileToUpload] = useState<FileItem | null>(null);
  const [showSharingProcessModal, setShowSharingProcessModal] = useState(false);
  const [sharingStage, setSharingStage] = useState<"key" | "encrypt" | "complete">("key");
  const [sharingProgress, setSharingProgress] = useState(0);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStage, setVerifyStage] = useState<"hash" | "blockchain" | "complete">("hash");
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [connectedAccount, setConnectedAccount] = useState<string>("");
  const [ecdsaKeyPair, setEcdsaKeyPair] = useState<{ privateKey: string; publicKey: string } | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [registryContract, setRegistryContract] = useState<ethers.Contract | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [showRegistrationForm, setShowRegistrationForm] = useState<boolean>(false);
  // Add these state variables
  const [allUsers, setAllUsers] = useState<Array<{id: string, name: string, public_key: string}>>([]);
  const [filteredUsers, setFilteredUsers] = useState<Array<{id: string, name: string, public_key: string}>>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState<boolean>(false);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  // Add a state for the selected user
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string, public_key: string} | null>(null);
  // Add a state for verification results
  const [verificationResult, setVerificationResult] = useState<{
    isVerified: boolean;
    fileHash: string;
    metadataHash: string;
    details: {
      owner: string;
      timestamp: string;
      fileName: string;
      fileExtension: string;
    } | null;
  } | null>(null);

  // Check if MetaMask is connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      setIsCheckingConnection(true);
      
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Get connected accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setIsWalletConnected(accounts.length > 0);
          
          if (accounts.length > 0) {
            // Format and set the connected account
            const account = accounts[0];
            setConnectedAccount(formatAddress(account));
            
            // Ask user to sign a message for authentication
            try {
              const message = "SECURECHAIN_LOGIN";
              const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, account]
              });
              
              console.log("Message signature:", signature);
              
              // Use the signature as a seed to create an ECDSA keypair
              const ecInstance = new ec('secp256k1');
              
              // Use the signature as a seed
              const hash = SHA256(signature).toString();
              
              // Generate keypair using private key derived from signature
              const pair = ecInstance.genKeyPair({
                entropy: hash,
              })
              
              const keyPair = {
                privateKey: pair.getPrivate('hex'),
                publicKey: pair.getPublic('hex'),
              };
              
              // You can store the keypair in state if needed
              setEcdsaKeyPair(keyPair);
              
            } catch (error) {
              console.error("Error generating keypair:", error);
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          setIsWalletConnected(false);
        }
      } else {
        setIsWalletConnected(false);
      }
      
      setIsCheckingConnection(false);
    };
    
    checkWalletConnection();
    
    // Cleanup listener on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  // Log keypair when dashboard is visible
  useEffect(() => {
    if (!isCheckingConnection && isWalletConnected && ecdsaKeyPair) {
      console.log("ECDSA Key Pair available in dashboard:");
      console.log("Private Key:", ecdsaKeyPair.privateKey);
      console.log("Public Key:", ecdsaKeyPair.publicKey);
    }
  }, [isCheckingConnection, isWalletConnected, ecdsaKeyPair]);

  // Format Ethereum address to show first 6 and last 4 characters
  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request accounts
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsWalletConnected(true);
        
        if (accounts.length > 0) {
          const account = accounts[0];
          setConnectedAccount(formatAddress(account));
          
          // Ask user to sign a message
          const message = "SECURECHAIN_LOGIN";
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, account]
          });
          
          console.log("Message signature:", signature);
          
          // Use the signature as a seed to create an ECDSA keypair
          try {
            // Import the necessary crypto libraries
            const ecInstance = new ec('secp256k1');
            
            // Use the signature as a seed
            const hash = SHA256(signature).toString();
            
            // Generate keypair using private key derived from signature
            const pair = ecInstance.genKeyPair({
              entropy: hash,
            })
            
            const keyPair = {
              privateKey: pair.getPrivate('hex'),
              publicKey: pair.getPublic('hex'),
            };
            
            // console.log("ECDSA Key Pair generated from signature:");
            // console.log("Private Key:", keyPair.privateKey);
            // console.log("Public Key:", keyPair.publicKey);
            
            // You can store the keypair in state if needed
            setEcdsaKeyPair(keyPair);
            
          } catch (error) {
            console.error("Error generating keypair:", error);
          }
        }
      } catch (error) {
        console.error("User rejected connection request", error);
      }
    } else {
      // Prompt user to install MetaMask
      window.open('https://metamask.io/download.html', '_blank');
    }
  };
  
  // Disconnect wallet function
  const disconnectWallet = () => {
    // Note: MetaMask doesn't actually support programmatic disconnection
    // We can only clear our app's state
    setIsWalletConnected(false);
    setConnectedAccount("");
    // Optionally redirect to login page
    router.push('/');
  };

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
      const fileWithMetadata: FileItem = {
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
      
      // Start the secure upload process
      processFileUpload(file);
    }
  };

  // Encrypt the symmetric key with the user's public key
  const encryptKeyWithPublicKey = (symmetricKey: string, publicKey: string): string => {
    // Use the EC-based encryption function
    const encryptedData = encryptWithPublicKey(publicKey, symmetricKey);
    
    // Return the encrypted data as a JSON string
    return JSON.stringify(encryptedData);
  };

  // Add the EC encryption functions
  function encryptWithPublicKey(recipientPubKeyHex: string, message: string) {
    const ecInstance = new ec('secp256k1');
    const ephemeralKey = ecInstance.genKeyPair();

    const recipientPubKey = ecInstance.keyFromPublic(recipientPubKeyHex, 'hex').getPublic();
    const sharedSecret = ephemeralKey.derive(recipientPubKey); // BN instance

    const sharedKey = SHA256(sharedSecret.toString(16)).toString(); // 256-bit AES key

    const encrypted = AES.encrypt(message, sharedKey).toString();

    return {
      ephemeralPubKey: ephemeralKey.getPublic('hex'), // send this to recipient
      ciphertext: encrypted,
    };
  }

  function createSharedKeyDHKE(recipientPubKeyHex: string, senderPrivKeyHex: string) {
    const ecInstance = new ec('secp256k1');
    const senderKeyPair = ecInstance.keyFromPrivate(senderPrivKeyHex, 'hex');

    const recipientPubKey = ecInstance.keyFromPublic(recipientPubKeyHex, 'hex').getPublic();
    const sharedSecret = senderKeyPair.derive(recipientPubKey);
    
    const sharedKey = SHA256(sharedSecret.toString(16)).toString();

    return sharedKey;
  }

  function decryptWithPrivateKey(recipientPrivKeyHex: string, ephemeralPubKeyHex: string, ciphertext: string) {
    const ecInstance = new ec('secp256k1');
    const recipientKey = ecInstance.keyFromPrivate(recipientPrivKeyHex, 'hex');
    const ephemeralPubKey = ecInstance.keyFromPublic(ephemeralPubKeyHex, 'hex').getPublic();

    const sharedSecret = recipientKey.derive(ephemeralPubKey);
    const sharedKey = SHA256(sharedSecret.toString(16)).toString();

    const decrypted = AES.decrypt(ciphertext, sharedKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // Process file share with reencryption
  const processFileShare = async (file: globalThis.File, fileItem: FileItem, recipientPubKeyHex: string, recipientEthereumAddr: string) => {
    try {
      // Check if window.ethereum exists
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("Ethereum provider not available");
      }
      
      // Step 1: Fetch document metadata from backend
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        throw new Error("No connected account found");
      }
      
      const ethereumAddress = accounts[0];
      
      // Fetch the document details using the file ID
      const response = await fetch(`http://localhost:8080/document/details/${fileItem.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document details: ${response.statusText}`);
      }
      
      const documentDetails = await response.json();
      console.log("Document details:", documentDetails);
      
      // Check if this is an upload type document
      if (documentDetails.type !== "upload") {
        throw new Error("Unsupported document type for download");
      }
      
      // Step 2: Get the IPFS hash and encrypted key
      const encryptedFileIpfsHash = documentDetails.encryptedFileIpfsHash;
      const encryptedKey = documentDetails.encryptionKey;
      
      if (!encryptedFileIpfsHash || !encryptedKey) {
        throw new Error("Missing file hash or encryption key");
      }
      
      // Step 3: Decrypt the symmetric key using the user's private key
      setDownloadProgress(30);
      
      if (!ecdsaKeyPair) {
        throw new Error("No private key available for decryption");
      }
      
      // Parse the encrypted key data
      const encryptedKeyData = JSON.parse(encryptedKey);
      const { ephemeralPubKey, ciphertext } = encryptedKeyData;
      
      // Decrypt the symmetric key
      const symmetricKey = decryptWithPrivateKey(
        ecdsaKeyPair.privateKey,
        ephemeralPubKey,
        ciphertext
      );
      
      console.log("Symmetric key decrypted successfully");
      setDownloadProgress(50);
      setDownloadStage("decrypt");
      
      // Step 4: Fetch the encrypted file from IPFS
      const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lavender-naval-skunk-990.mypinata.cloud';
      const ipfsUrl = `https://${pinataGateway}/ipfs/${encryptedFileIpfsHash}`;
      console.log("Fetching file from IPFS:", ipfsUrl);
      
      const fileResponse = await fetch(ipfsUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file from IPFS: ${fileResponse.statusText}`);
      }
      
      // Get the encrypted file data
      const encryptedFileData = await fileResponse.arrayBuffer();
      console.log("Encrypted file fetched from IPFS");
      setDownloadProgress(70);
      
      // Step 5: Decrypt the file using the symmetric key
      const decryptedData = await decryptFile(encryptedFileData, symmetricKey);
      console.log("File decrypted successfully");
      setDownloadProgress(90);

      // Step 6: Create a shared key with the recipient using DHKE
      const sharedKey = createSharedKeyDHKE(recipientPubKeyHex, ecdsaKeyPair.privateKey);
      console.log("Shared key created successfully");
      
      // Step 7: Re-encrypt the decrypted data with the shared key
      // Create a Blob from the decrypted data
      const decryptedBlob = new Blob([decryptedData]);
      const decryptedFile = new File([decryptedBlob], fileItem.name, { type: 'application/octet-stream' });
      
      // Encrypt the file with the shared key
      const reencryptedData = await encryptFile(decryptedFile, sharedKey);
      console.log("File re-encrypted successfully with shared key");
      setDownloadProgress(100);

      // Step 8: Prepare the IPFS document structure for sharing
      const ipfsDocument = {
        type: "share",
        fileName: fileItem.name,
        extension: fileItem.name.split('.').pop() || "",
        ownerPubKey: ecdsaKeyPair.publicKey,
        recipientPubKey: recipientPubKeyHex,
        ownerEthereumAddr: ethereumAddress, // Current user is the owner
        recipientEthereumAddr: recipientEthereumAddr // Selected user is the recipient
      };

      // Step 9: Upload encrypted file and metadata to IPFS using Pinata
      const { fileIpfsHash, metadataIpfsHash } = await uploadToPinata(reencryptedData, ipfsDocument, fileItem.name);
      console.log("File uploaded to IPFS with hash:", fileIpfsHash);

          // Step 10: Register the shared file on blockchain
    if (registryContract) {
      try {
        const fileName = fileItem.name;
        const fileExtension = fileItem.name.split('.').pop() || "";
        const tx = await registryContract.shareFile(
          fileName,
          fileExtension,
          fileItem.id,
          fileIpfsHash,
          metadataIpfsHash,
          recipientEthereumAddr
        );
        console.log("File sharing transaction sent:", tx.hash);
        await tx.wait();
        console.log("File shared successfully on blockchain");
      } catch (error) {
        console.error("Error sharing file on blockchain:", error);
          // Continue with the process even if blockchain registration fails
        }
      }

      // Step 10: Store document in backend
      const document = {
        id: metadataIpfsHash,
        type: "share",
        fileName: fileItem.name,
        extension: fileItem.name.split('.').pop() || "",
        ownerPubKey: ecdsaKeyPair.publicKey,
        recipientPubKey: recipientPubKeyHex,
        ownerEthereumAddr: ethereumAddress, // Current user is the owner
        recipientEthereumAddr: recipientEthereumAddr, // Selected user is the recipient
        encryptedFileIpfsHash: fileIpfsHash,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Send document to backend
      const responseDHKE = await fetch('http://localhost:8080/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      });

      if (!responseDHKE.ok) {
        throw new Error(`Failed to store document in backend: ${responseDHKE.statusText}`);
      }

      console.log("Document stored in backend successfully");
      setDownloadProgress(100);
      setDownloadStage("complete");

      // Add file to state after completion
      setTimeout(() => {
        setShowSharingProcessModal(false);
        setShareEmail("");
        setSelectedFile(null);
        setSharingStage("key");
        setSharingProgress(0);
        setSelectedUser(null);
        
        // Update the UI to show the file is now shared
        const updatedFiles = files.map((f) => {
          if (f.id === fileItem.id) {
            return { ...f, shared: true };
          }
          return f;
        });
        setFiles(updatedFiles);
      }, 1000);

    } catch (error) {
      console.error("Error during file sharing process:", error);
      // Handle error state
      setSharingStage("key");
      setShowSharingProcessModal(false);
      alert("Failed to share file. Please try again.");
    }
  };
  

  // Process file upload with encryption and IPFS storage
  const processFileUpload = async (file: globalThis.File) => {
    try {
      // Step 1: Compute file hash for future verification
      const fileHash = await computeFileHash(file);
      console.log("File hash computed:", fileHash);
      setEncryptionProgress(20);
      
      // Step 2: Generate a random symmetric encryption key
      const symmetricKey = generateRandomEncryptionKey();
      console.log("Symmetric key generated");
      setEncryptionProgress(40);
      setEncryptionStage("encrypt");
      
      // Step 3: Encrypt the file with the symmetric key
      const encryptedFileData = await encryptFile(file, symmetricKey);
      console.log("File encrypted successfully");
      setEncryptionProgress(60);
      
      // Step 4: Encrypt the symmetric key with the user's public key
      if (!ecdsaKeyPair) {
        throw new Error("No public key available for encryption");
      }
      const encryptedKey = encryptKeyWithPublicKey(symmetricKey, ecdsaKeyPair.publicKey);
      console.log("Encryption key secured with public key");
      setEncryptionProgress(80);
      
      // Step 5: Prepare the IPFS document structure
      const ipfsDocument = {
        type: "upload",
        fileName: file.name,
        extension: file.name.split('.').pop() || "",
        encryptionKey: encryptedKey,
        ownerPubKey: ecdsaKeyPair.publicKey,
        ownerEthereumAddr: typeof window !== 'undefined' && window.ethereum 
          ? await window.ethereum.request({ method: 'eth_accounts' }).then(accounts => accounts[0])
          : "unknown"
      };
      
      // Step 6: Upload encrypted file and metadata to IPFS using Pinata
      const { fileIpfsHash, metadataIpfsHash } = await uploadToPinata(encryptedFileData, ipfsDocument, file.name);
      console.log("File uploaded to IPFS with hash:", fileIpfsHash);


      // Step 6.5: Register file on blockchain
      if (registryContract) {
        try {
          const fileName = file.name;
        const fileExtension = file.name.split('.').pop() || "";
        const tx = await registryContract.registerFile(
          fileName,
          fileExtension,
          metadataIpfsHash,
          fileIpfsHash
        );
        console.log("File registration transaction sent:", tx.hash);
        await tx.wait();
        console.log("File registered successfully on blockchain");
      } catch (error) {
        console.error("Error registering file on blockchain:", error);
          // Continue with the process even if blockchain registration fails
        }
      }
      
      // Step 7: Store document in backend
      const document = {
        id: metadataIpfsHash,
        type: "upload",
        fileName: file.name,
        extension: file.name.split('.').pop() || "",
        encryptionKey: encryptedKey,
        ownerPubKey: ecdsaKeyPair.publicKey,
        ownerEthereumAddr: typeof window !== 'undefined' && window.ethereum 
          ? await window.ethereum.request({ method: 'eth_accounts' }).then(accounts => accounts[0])
          : "unknown",
        encryptedFileIpfsHash: fileIpfsHash,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Send document to backend
      const response = await fetch('http://localhost:8080/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to store document in backend: ${response.statusText}`);
      }
      
      console.log("Document stored in backend successfully");
      setEncryptionProgress(100);
      setEncryptionStage("complete");
      
      // Add file to state after completion
      setTimeout(() => {
        const newFile: FileItem = {
          id: metadataIpfsHash,
          name: file.name,
          type: file.name.split('.').pop() || "",
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadDate: new Date().toISOString().split('T')[0],
          owner: "You",
          shared: false,
          accessLevel: "owner",
        };
        
        setFiles([newFile, ...files]);
        setShowEncryptionModal(false);
        setFileToUpload(null);
        setEncryptionStage("key");
        setEncryptionProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error("Error during file upload process:", error);
      // Handle error state
      setEncryptionStage("key");
      setShowEncryptionModal(false);
      alert("Failed to upload file. Please try again.");
    }
  };

  // Upload to Pinata IPFS
  const uploadToPinata = async (
    encryptedFileData: ArrayBuffer, 
    metadata: any, 
    fileName: string
  ): Promise<{ fileIpfsHash: string; metadataIpfsHash: string }> => {
    try {
      // Create a Blob from the encrypted file data
      const encryptedBlob = new Blob([encryptedFileData], { type: 'application/octet-stream' });
      
      // Create a File object from the Blob
      const encryptedFile = new File([encryptedBlob], fileName, { type: 'application/octet-stream' });
      
      // Initialize Pinata SDK with JWT
      const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlZTI3NGYxZC1kZTg1LTRiN2ItODJiYS1hNzAwNDE4YThhODAiLCJlbWFpbCI6InByYWoyazJAcHJvdG9ubWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNzdjMGFkM2VmYzhkM2MxOTM1YzUiLCJzY29wZWRLZXlTZWNyZXQiOiJiNzg4MTViNmIzOTFlYTQxMTk5ODZjZWNkZTMxMzEyODE3MTFjNTZlMjliMWFlZmNiMDA3ZDYyOTEzNWFlNjIyIiwiZXhwIjoxNzc1NTE0NTM0fQ.dGCMCeJpElz1P3kmMJqLmMhw5dK1850m2DBDNrIYkFc';
      const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lavender-naval-skunk-990.mypinata.cloud';
      
      if (!pinataJWT) {
        console.error("Pinata JWT not configured");
        throw new Error("Pinata JWT not configured");
      }
      
      const pinata = new PinataSDK({
        pinataJwt: pinataJWT,
        pinataGateway: pinataGateway
      });
      
      // Upload the encrypted file to Pinata
      const fileUploadResult = await pinata.upload.public.file(encryptedFile);
      // Access the CID property from the response (this is the IPFS hash)
      const fileIpfsHash = fileUploadResult.cid;
      
      // Now upload the metadata JSON with reference to the file
      const metadataWithFileRef = {
        ...metadata,
        encryptedFileIpfsHash: fileIpfsHash,
      };
      
      // Upload metadata as JSON
      const jsonUploadResult = await pinata.upload.public.json(metadataWithFileRef);
      
      return {
        fileIpfsHash: fileIpfsHash,
        metadataIpfsHash: jsonUploadResult.cid
      };
      
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      throw error;
    }
  };

  // Compute hash of file contents
  const computeFileHash = (file: globalThis.File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (!event.target || !event.target.result) {
            throw new Error("Failed to read file");
          }
          
          // Use SHA-256 to hash the file contents
          const hash = SHA256(event.target.result.toString()).toString();
          resolve(hash);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Generate a random encryption key for symmetric encryption
  const generateRandomEncryptionKey = (): string => {
    // In a real implementation, use a cryptographically secure random generator
    const array = new Uint8Array(32); // 256 bits
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Encrypt file with symmetric key
  const encryptFile = async (file: globalThis.File, key: string): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (!event.target || !event.target.result) {
            throw new Error("Failed to read file");
          }
          
          // Get the file data as an ArrayBuffer
          const fileData = event.target.result as ArrayBuffer;
          
          // Convert ArrayBuffer to WordArray for CryptoJS
          const wordArray = CryptoJS.lib.WordArray.create(fileData);
          
          // Encrypt the data with AES using the provided key
          const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
          
          // Convert the encrypted string back to an ArrayBuffer for storage
          const encryptedBuffer = new TextEncoder().encode(encrypted).buffer;
          
          resolve(encryptedBuffer);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Decrypt file with symmetric key
  const decryptFile = async (encryptedData: ArrayBuffer, key: string): Promise<ArrayBuffer> => {
    try {
      console.log("Decrypting file with key:", key.substring(0, 10) + "...");
      console.log("Encrypted data type:", Object.prototype.toString.call(encryptedData));
      console.log("Encrypted data size:", encryptedData.byteLength);
      
      // Convert ArrayBuffer to string (assuming it was stored as a CryptoJS encrypted string)
      const encryptedString = new TextDecoder().decode(encryptedData);
      console.log("Encrypted string length:", encryptedString.length);
      console.log("First 50 chars of encrypted string:", encryptedString.substring(0, 50) + "...");
      
      // Decrypt the data with AES using the provided key
      const decrypted = CryptoJS.AES.decrypt(encryptedString, key);
      console.log("Decryption completed, word array length:", decrypted.words.length);
      
      // Convert the decrypted WordArray to ArrayBuffer
      const arrayBuffer = wordArrayToArrayBuffer(decrypted);
      console.log("Converted to ArrayBuffer, size:", arrayBuffer.byteLength);
      
      return arrayBuffer;
    } catch (error) {
      console.error("Error in decryptFile function:", error);
      console.log("Error details:", error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };

  // Helper function to convert CryptoJS WordArray to ArrayBuffer
  const wordArrayToArrayBuffer = (wordArray: CryptoJS.lib.WordArray): ArrayBuffer => {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    
    // Create a new Uint8Array with the correct size
    const u8 = new Uint8Array(sigBytes);
    
    // Copy the bytes from the WordArray to the Uint8Array
    for (let i = 0; i < sigBytes; i++) {
      const idx = Math.floor(i / 4);
      const bitShift = (3 - (i % 4)) * 8;
      u8[i] = (words[idx] >>> bitShift) & 0xff;
    }
    
    return u8.buffer;
  };

  // Handle file sharing
  const handleShare = async () => {
    if (!selectedFile || !selectedUser) return;
    
    try {
      setShowShareModal(false);
      setShowSharingProcessModal(true);
      setSharingStage("key");
      setSharingProgress(0);
      
      // Check if window.ethereum exists
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("Ethereum provider not available");
      }
      
      // Get the recipient's Ethereum address directly from selected user
      const recipientEthereumAddr = selectedUser.id;
      
      if (!ethers.isAddress(recipientEthereumAddr)) {
        throw new Error("Invalid Ethereum address format");
      }
      
      // Get the recipient's public key directly from selected user
      const recipientPubKeyHex = selectedUser.public_key;
      
      console.log("Recipient's public key:", recipientPubKeyHex);
      setSharingProgress(30);
      setSharingStage("encrypt");
      
      // Fetch the file from IPFS
      const response = await fetch(`http://localhost:8080/document/details/${selectedFile.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document details: ${response.statusText}`);
      }
      
      const documentDetails = await response.json();
      console.log("Document details for sharing:", documentDetails);
      
      // Get the IPFS hash
      const encryptedFileIpfsHash = documentDetails.encryptedFileIpfsHash;
      
      // Fetch the file from IPFS
      const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lavender-naval-skunk-990.mypinata.cloud';
      const ipfsUrl = `https://${pinataGateway}/ipfs/${encryptedFileIpfsHash}`;
      
      const fileResponse = await fetch(ipfsUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file from IPFS: ${fileResponse.statusText}`);
      }
      
      // Create a File object from the response
      const blob = await fileResponse.blob();
      const file = new File([blob], selectedFile.name, { type: blob.type });
      
      setSharingProgress(60);
      
      // Process the file share with the recipient's address
      await processFileShare(file, selectedFile, recipientPubKeyHex, recipientEthereumAddr);
      
      setSharingProgress(100);
      setSharingStage("complete");
      
      // Update the shared status
      const updatedFiles = files.map((file) => {
        if (file.id === selectedFile.id) {
          return { ...file, shared: true };
        }
        return file;
      });
      
      // Close modal and reset after completion
      setTimeout(() => {
        setFiles(updatedFiles);
        setShowSharingProcessModal(false);
        setShareEmail("");
        setSelectedFile(null);
        setSharingStage("key");
        setSharingProgress(0);
        setSelectedUser(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error sharing file:", error);
      alert(`Failed to share file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowSharingProcessModal(false);
      setSharingStage("key");
      setSharingProgress(0);
    }
  };

  // Handle file download with stages
  const handleDownload = async (file: FileItem) => {
    setSelectedFile(file);
    setDownloadStage("key");
    setDownloadProgress(0);
    setShowDownloadModal(true);
    
    try {
      // Check if window.ethereum exists
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("Ethereum provider not available");
      }
      
      // Step 1: Fetch document metadata from backend
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        throw new Error("No connected account found");
      }
      
      const ethereumAddress = accounts[0];
      
      // Fetch the document details using the file ID
      const response = await fetch(`http://localhost:8080/document/details/${file.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document details: ${response.statusText}`);
      }
      
      const documentDetails = await response.json();
      console.log("Document details:", documentDetails);
      
      // Get the IPFS hash
      const encryptedFileIpfsHash = documentDetails.encryptedFileIpfsHash;
      
      if (!encryptedFileIpfsHash) {
        throw new Error("Missing file hash");
      }
      
      // Handle different document types
      let symmetricKey;
      
      if (documentDetails.type === "upload") {
        // Handle upload type document
        const encryptedKey = documentDetails.encryptionKey;
        
        if (!encryptedKey) {
          throw new Error("Missing encryption key");
        }
        
        // Step 3: Decrypt the symmetric key using the user's private key
        setDownloadProgress(30);
        
        if (!ecdsaKeyPair) {
          throw new Error("No private key available for decryption");
        }
        
        // Parse the encrypted key data
        const encryptedKeyData = JSON.parse(encryptedKey);
        const { ephemeralPubKey, ciphertext } = encryptedKeyData;
        
        // Decrypt the symmetric key
        symmetricKey = decryptWithPrivateKey(
          ecdsaKeyPair.privateKey,
          ephemeralPubKey,
          ciphertext
        );
        
        console.log("Symmetric key decrypted successfully for upload type");
      } 
      else if (documentDetails.type === "share") {
        // Handle share type document
        setDownloadProgress(30);
        
        if (!ecdsaKeyPair) {
          throw new Error("No private key available for decryption");
        }
        
        // Determine if the current user is the owner or recipient
        const isOwner = documentDetails.ownerEthereumAddr.toLowerCase() === ethereumAddress.toLowerCase();
        const isRecipient = documentDetails.recipientEthereumAddr.toLowerCase() === ethereumAddress.toLowerCase();
        
        console.log("Current user is owner:", isOwner);
        console.log("Current user is recipient:", isRecipient);
        
        if (!isOwner && !isRecipient) {
          throw new Error("You don't have permission to access this file");
        }
        
        // Get the appropriate public key based on user role
        let partnerPubKey;
        
        if (isOwner) {
          // If current user is owner, use recipient's public key
          partnerPubKey = documentDetails.recipientPubKey;
          console.log("Using recipient's public key for DHKE:", partnerPubKey);
        } else {
          // If current user is recipient, use owner's public key
          partnerPubKey = documentDetails.ownerPubKey;
          console.log("Using owner's public key for DHKE:", partnerPubKey);
        }
        
        if (!partnerPubKey) {
          throw new Error("Missing partner public key for shared file");
        }
        
        // Create shared key using DHKE
        symmetricKey = createSharedKeyDHKE(
          partnerPubKey,
          ecdsaKeyPair.privateKey
        );
        
        console.log("Shared key created successfully using DHKE:", symmetricKey.substring(0, 10) + "...");
      }
      else {
        throw new Error(`Unsupported document type: ${documentDetails.type}`);
      }
      
      setDownloadProgress(50);
      setDownloadStage("decrypt");
      
      // Step 4: Fetch the encrypted file from IPFS
      const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lavender-naval-skunk-990.mypinata.cloud';
      const ipfsUrl = `https://${pinataGateway}/ipfs/${encryptedFileIpfsHash}`;
      console.log("Fetching file from IPFS:", ipfsUrl);
      
      const fileResponse = await fetch(ipfsUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file from IPFS: ${fileResponse.statusText}`);
      }
      
      // Get the encrypted file data
      const encryptedFileData = await fileResponse.arrayBuffer();
      console.log("Encrypted file fetched from IPFS, size:", encryptedFileData.byteLength);
      setDownloadProgress(70);
      
      // Step 5: Decrypt the file using the appropriate key
      try {
        console.log("Starting file decryption with key");
        const decryptedData = await decryptFile(encryptedFileData, symmetricKey);
        console.log("File decrypted successfully, size:", decryptedData.byteLength);
        setDownloadProgress(90);
        
        // Step 6: Create a download link and trigger download
        const blob = new Blob([decryptedData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setDownloadProgress(100);
        setDownloadStage("complete");
        
        // Close modal after a delay
        setTimeout(() => {
          setShowDownloadModal(false);
          setSelectedFile(null);
          setDownloadStage("key");
          setDownloadProgress(0);
        }, 2000);
      } catch (decryptError) {
        console.error("Error during file decryption:", decryptError);
        throw new Error(`Failed to decrypt file: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
      }
      
    } catch (error: unknown) {
      console.error("Error downloading file:", error);
      let errorMessage = "Failed to download file";
      
      // Check if error is an Error object
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      alert(errorMessage);
      setShowDownloadModal(false);
      setSelectedFile(null);
      setDownloadStage("key");
      setDownloadProgress(0);
    }
  };

  // Handle file verification
  const handleVerify = async (file: FileItem) => {
    setSelectedFile(file);
    setShowVerifyModal(true);
    setVerifyStage("hash");
    setVerifyProgress(0);
    
    try {
      // Step 1: Fetch document metadata from backend
      setVerifyProgress(20);
      
      const response = await fetch(`http://localhost:8080/document/details/${file.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document details: ${response.statusText}`);
      }
      
      const documentDetails = await response.json();
      console.log("Document details for verification:", documentDetails);
      
      // Get the IPFS hash
      const encryptedFileIpfsHash = documentDetails.encryptedFileIpfsHash;
      const metadataIpfsHash = file.id; // The file ID is the metadata IPFS hash
      
      if (!encryptedFileIpfsHash || !metadataIpfsHash) {
        throw new Error("Missing file hash information");
      }
      
      setVerifyProgress(50);
      setVerifyStage("blockchain");
      
      // Step 2: Verify on blockchain using the smart contract
      if (!registryContract) {
        throw new Error("Smart contract not initialized");
      }
      
      // Call the verifyFile method from the smart contract
      const isVerified = await registryContract.verifyFile(
        file.id
      );
      
      console.log("Blockchain verification result:", isVerified);
      
      // Store verification result
      setVerificationResult({
        isVerified,
        fileHash: encryptedFileIpfsHash,
        metadataHash: metadataIpfsHash,
        details: null
      });
      
      // If verified, get additional details
      if (isVerified) {
        try {
          const fileDetailsResponse = await fetch(`http://localhost:8080/document/details/${file.id}`);
          const fileDetails = await fileDetailsResponse.json();
          console.log("File details from blockchain:", fileDetails);
          
          // Extract and store details for display in UI
          // Make sure we properly handle the timestamp and check for null/undefined values
          const owner = fileDetails.ownerEthereumAddr || "Not available";
          
          setVerificationResult(prev => {
            if (!prev) return null;
            return {
              ...prev,
              details: {
                owner: owner === "0x0000000000000000000000000000000000000000" ? "Not available" : owner,
                timestamp: fileDetails.createdAt,
                fileName: fileDetails.fileName || file.name || "Not available",
                fileExtension: fileDetails.fileExtension || file.type || "Not available"
              }
            };
          });
        } catch (detailsError) {
          console.error("Error fetching file details:", detailsError);
          // Set default values if details fetch fails
          setVerificationResult(prev => {
            if (!prev) return null;
            return {
              ...prev,
              details: {
                owner: "Could not retrieve",
                timestamp: "Could not retrieve",
                fileName: file.name || "Not available",
                fileExtension: file.type || "Not available"
              }
            };
          });
        }
      }
      
      setVerifyProgress(100);
      setVerifyStage("complete");
      
      // Don't automatically close modal so user can see results
      // Only reset when user manually closes
    } catch (error) {
      console.error("Error verifying file:", error);
      alert(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowVerifyModal(false);
      setSelectedFile(null);
      setVerifyStage("hash");
      setVerifyProgress(0);
      setVerificationResult(null);
    }
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

  // Initialize contract when wallet is connected
  useEffect(() => {
    const initializeContract = async () => {
      if (typeof window.ethereum !== 'undefined' && isWalletConnected) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(
            REGISTRY_CONTRACT_ADDRESS,
            registryABI,
            signer
          );
          
          setRegistryContract(contract);
          
          // Check if user is registered
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const isUserRegistered = await contract.hasPublicKey(accounts[0]);
            setIsRegistered(isUserRegistered);
            
            // If registered, fetch their public key
            if (isUserRegistered) {
              const publicKeyBytes = await contract.getPublicKey(accounts[0]);
              console.log("User's registered public key:", publicKeyBytes);
            }
          }
        } catch (error) {
          console.error("Error initializing contract:", error);
        }
      }
    };
    
    initializeContract();
  }, [isWalletConnected]);
  
  // Register public key on blockchain
  const registerPublicKey = async () => {
    if (!registryContract || !ecdsaKeyPair) return;
    
    try {
      setIsRegistering(true);
      setRegistrationError(null);
      
      if (!showRegistrationForm) {
        setShowRegistrationForm(true);
        return;
      }
      
      if (!userName.trim()) {
        setRegistrationError("Please enter your name");
        return;
      }
      
      // Convert public key to bytes format for the contract
      const publicKeyBytes = ethers.getBytes('0x' + ecdsaKeyPair.publicKey);
      
      // Call the contract to register the public key
      const tx = await registryContract.registerPublicKey(publicKeyBytes);
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      console.log("Public key registered successfully");
      
      // Check if window.ethereum exists
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("Ethereum provider not available");
      }
      
      // Get the user's Ethereum address
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        throw new Error("No connected account found");
      }
      
      const ethereumAddress = accounts[0];
      
      // Store user data in backend
      const userData = {
        id: ethereumAddress,
        public_key: ecdsaKeyPair.publicKey,
        name: userName.trim(),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Send user data to backend
      const response = await fetch('http://localhost:8080/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to store user data: ${response.statusText}`);
      }
      
      console.log("User data stored in backend successfully");
      setIsRegistered(true);
    } catch (error) {
      console.error("Error registering public key:", error);
      setRegistrationError("Failed to register public key. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Register file on blockchain
  const registerFileOnBlockchain = async (ipfsHash: string) => {
    if (!registryContract) return false;
    
    try {
      const tx = await registryContract.registerFile(ipfsHash);
      console.log("File registration transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      console.log("File registered successfully on blockchain");
      return true;
    } catch (error) {
      console.error("Error registering file on blockchain:", error);
      return false;
    }
  };
  
  // Verify file on blockchain
  const verifyFileOnBlockchain = async (ipfsHash: string) => {
    if (!registryContract) return false;
    
    try {
      const isVerified = await registryContract.verifyFile(ipfsHash);
      
      if (isVerified) {
        // Get file details
        const [fileIpfsHash, owner, timestamp] = await registryContract.getFileDetails(ipfsHash);
        console.log("File details:", {
          ipfsHash: fileIpfsHash,
          owner,
          timestamp: new Date(Number(timestamp)* 1000).toLocaleString()
        });
      }
      
      return isVerified;
    } catch (error) {
      console.error("Error verifying file on blockchain:", error);
      return false;
    }
  };
  
  // Add this function to generate IPFS gateway links
  const getIpfsGatewayLink = (cid: string): string => {
    const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'lavender-naval-skunk-990.mypinata.cloud';
    return `https://${pinataGateway}/ipfs/${cid}`;
  };
  
  // Share file with another user
  const shareFileOnBlockchain = async (documentHash: string, ipfsHash: string, recipientAddress: string) => {
    if (!registryContract) return false;
    
    try {
      const tx = await registryContract.shareFile(documentHash, ipfsHash, recipientAddress);
      console.log("File sharing transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      console.log("File shared successfully on blockchain");
      return true;
    } catch (error) {
      console.error("Error sharing file on blockchain:", error);
      return false;
    }
  };

  // Fetch user's files when wallet is connected
  useEffect(() => {
    const fetchUserFiles = async () => {
      if (isWalletConnected && !isCheckingConnection) {
        try {
          setIsLoading(true);
          setLoadError(null);
          
          // Check if window.ethereum exists
          if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error("Ethereum provider not available");
          }
          
          // Get the user's Ethereum address
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            throw new Error("No connected account found");
          }
          
          const ethereumAddress = accounts[0];
          
          // Fetch documents from backend
          const response = await fetch(`http://localhost:8080/document/${ethereumAddress}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch documents: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("Fetched documents:", data);
          
          // Check if the response has the expected structure
          const documentsOwned = Array.isArray(data.documentsOwned) ? data.documentsOwned : [];
          const documentsShared = Array.isArray(data.documentsShared) ? data.documentsShared : [];
          
          // Convert owned documents to FileItem format
          const ownedFileItems: FileItem[] = documentsOwned.map((doc: any) => ({
            id: doc._id || doc.id || Date.now().toString(),
            name: doc.fileName || "Unnamed File",
            type: doc.extension || "unknown",
            size: doc.fileSize ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB` : "Unknown",
            uploadDate: new Date(doc.createdAt).toISOString().split('T')[0],
            owner: "You",
            shared: false,
            accessLevel: "owner",
          }));
          
          // Convert shared documents to FileItem format
          const sharedFileItems: FileItem[] = documentsShared.map((doc: any) => ({
            id: doc._id || doc.id || Date.now().toString(),
            name: doc.fileName || "Unnamed File",
            type: doc.extension || "unknown",
            size: doc.fileSize ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB` : "Unknown",
            uploadDate: new Date(doc.createdAt).toISOString().split('T')[0],
            owner: doc.ownerEthereumAddr === ethereumAddress ? "You" : 
                   doc.ownerEthereumAddr.substring(0, 6) + "..." + doc.ownerEthereumAddr.substring(doc.ownerEthereumAddr.length - 4),
            shared: true,
            accessLevel: doc.ownerEthereumAddr === ethereumAddress ? "owner" : "view",
          }));
          
          // Combine both arrays
          setFiles([...ownedFileItems, ...sharedFileItems]);
        } catch (error) {
          console.error("Error fetching user files:", error);
          setLoadError("Failed to load your files. Please try again.");
          // Keep using mock data if fetch fails
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserFiles();
  }, [isWalletConnected, isCheckingConnection]);

  // Add this function to fetch all users
  const fetchAllUsers = async () => {
    try {
      setIsSearchingUsers(true);
      const response = await fetch('http://localhost:8080/user');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const users = await response.json();
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Add this function to filter users based on search query
  const filterUsers = (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(allUsers);
      return;
    }
    
    const filtered = allUsers.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) || 
      user.id.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // If still checking connection or wallet is not connected, show connect screen
  if (isCheckingConnection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <Image 
              src="/logo.png" 
              alt="SecureChain Logo" 
              width={48} 
              height={48}
              className="rounded-lg bg-white/10 p-2"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-center text-white mb-8">
            Connect with MetaMask
          </h1>
          
          <div className="space-y-6">
            {typeof window !== 'undefined' && !window.ethereum ? (
              <div className="text-center">
                <p className="text-white/80 mb-4">
                  MetaMask is not installed. Please install MetaMask to continue.
                </p>
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09082L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.04858 1L15.0707 10.809L12.7383 5.09082L2.04858 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M28.2292 23.5334L24.7545 28.8875L32.2465 30.9398L34.4162 23.6501L28.2292 23.5334Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M0.600098 23.6501L2.7598 30.9398L10.2418 28.8875L6.77719 23.5334L0.600098 23.6501Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Install MetaMask
                </a>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <Image 
                    src="/metamask-fox.svg" 
                    alt="MetaMask Logo" 
                    width={80} 
                    height={80}
                    className="mb-4"
                  />
                </div>
                <p className="text-white/80 text-center">
                  Connect your MetaMask wallet to access the SecureChain platform.
                </p>
                
                <button
                  onClick={connectWallet}
                  className="w-full py-3 px-4 bg-[#F6851B] hover:bg-[#E2761B] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6851B] flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09082L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.04858 1L15.0707 10.809L12.7383 5.09082L2.04858 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M28.2292 23.5334L24.7545 28.8875L32.2465 30.9398L34.4162 23.6501L28.2292 23.5334Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M0.600098 23.6501L2.7598 30.9398L10.2418 28.8875L6.77719 23.5334L0.600098 23.6501Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Connect with MetaMask
                </button>
              </>
            )}
            
            <div className="text-center text-white/70 text-sm">
              <p>New to MetaMask?</p>
              <a 
                href="https://metamask.io/faqs/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-white transition-colors"
              >
                Learn how to set up MetaMask
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-white/50 text-sm text-center absolute bottom-8">
          <p>By continuing, you agree to SecureChain's</p>
          <p className="flex gap-3 justify-center mt-1">
            <Link href="/terms" className="text-indigo-300 hover:text-white transition-colors">Terms of Service</Link>
            <span>&</span>
            <Link href="/privacy" className="text-indigo-300 hover:text-white transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    );
  }

  // If wallet is connected but not registered, show registration screen
  if (isWalletConnected && !isRegistered && ecdsaKeyPair) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <Image 
              src="/logo.png" 
              alt="SecureChain Logo" 
              width={48} 
              height={48}
              className="rounded-lg bg-white/10 p-2"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-center text-white mb-4">
            Register Your Key
          </h1>
          
          <p className="text-white text-center mb-6">
            Your wallet is connected, but you need to register your public key on the blockchain to use SecureChain.
          </p>
          
          <div className="bg-white/20 rounded-lg p-4 mb-6">
            <p className="text-white text-sm mb-2">Your public key:</p>
            <p className="text-white text-xs font-mono break-all">
              {ecdsaKeyPair.publicKey.substring(0, 20)}...{ecdsaKeyPair.publicKey.substring(ecdsaKeyPair.publicKey.length - 20)}
            </p>
          </div>
          
          {showRegistrationForm && (
            <div className="mb-6">
              <label className="block text-white text-sm mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <p className="text-white text-xs mt-1">
                This name will be visible to others when you share files.
              </p>
            </div>
          )}
          
          {registrationError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
              <p className="text-white text-sm">{registrationError}</p>
            </div>
          )}
          
          <button
            onClick={registerPublicKey}
            disabled={isRegistering}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center disabled:opacity-70"
          >
            {isRegistering ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </>
            ) : (
              showRegistrationForm ? "Complete Registration" : "Register Public Key"
            )}
          </button>
          
          <div className="mt-4 text-center">
            <button
              onClick={disconnectWallet}
              className="text-white hover:text-white text-sm"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Wallet Connection Status */}
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm font-medium">{connectedAccount}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={disconnectWallet}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Disconnect Wallet"
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </button>
              
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
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-800">Loading your files...</p>
            </div>
          ) : loadError ? (
            <div className="py-12 text-center">
              <div className="bg-red-100 text-red-700 p-4 rounded-lg inline-block">
                <p>{loadError}</p>
                <button 
                  className="mt-2 text-indigo-600 hover:underline"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Access
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
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
                            <div className="text-sm text-gray-700">.{file.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{file.owner}</div>
                        <div className="text-xs text-gray-700">
                          {file.shared ? "Shared" : "Private"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{file.uploadDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {file.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold ${
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
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-700">
                      No files found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Upload File</h2>
            <p className="text-gray-800 mb-6">
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
              <p className="mt-2 text-sm text-gray-700">
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
            <p className="text-gray-800 mb-6">
              Share "{selectedFile.name}" securely with others using end-to-end encryption.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Users
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search by name or address"
                  value={userSearchQuery}
                  onChange={(e) => filterUsers(e.target.value)}
                  onFocus={() => {
                    if (allUsers.length === 0) {
                      fetchAllUsers();
                    }
                  }}
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
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
            </div>
            
            {/* User search results */}
            <div className="mb-6 max-h-60 overflow-y-auto">
              {isSearchingUsers ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredUsers.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <li 
                      key={user.id} 
                      className={`py-2 px-3 cursor-pointer hover:bg-gray-50 rounded-lg ${
                        selectedUser?.id === user.id ? 'bg-indigo-50 border border-indigo-200' : ''
                      }`}
                      onClick={() => {
                        setSelectedUser(user);
                        setShareEmail(user.id); // Keep this for backward compatibility
                      }}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-700">{user.id.substring(0, 6)}...{user.id.substring(user.id.length - 4)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : userSearchQuery ? (
                <p className="text-center py-4 text-gray-700">No users found matching "{userSearchQuery}"</p>
              ) : (
                <p className="text-center py-4 text-gray-700">Start typing to search for users</p>
              )}
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
                  setSelectedUser(null);
                  setUserSearchQuery("");
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-indigo-600 text-white rounded-lg ${
                  !selectedUser ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"
                }`}
                onClick={handleShare}
                disabled={!selectedUser}
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
            <p className="text-gray-800 mb-6">
              Verifying "{selectedFile.name}" on the blockchain
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
                  <h3 className="text-sm font-medium text-gray-900">Retrieving File Metadata</h3>
                  <p className="text-xs text-gray-700">Checking IPFS hash and document integrity</p>
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
                    <span className="text-gray-700">2</span>
                  )}
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-sm font-medium text-gray-900">Verifying on Blockchain</h3>
                  <p className="text-xs text-gray-700">Confirming authenticity with smart contract</p>
                </div>
              </div>
            </div>
            
            {/* Verification Results */}
            {verifyStage === "complete" && verificationResult && (
              <div className="mb-6 border rounded-lg overflow-hidden">
                <div className={`p-4 ${verificationResult.isVerified ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center">
                    {verificationResult.isVerified ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <h3 className="ml-2 text-lg font-medium text-gray-900">
                      {verificationResult.isVerified ? "Verified Authentic" : "Verification Failed"}
                    </h3>
                  </div>
                  <p className="mt-1 text-gray-800">
                    {verificationResult.isVerified 
                      ? "This file has been verified on the blockchain and is authentic." 
                      : "This file could not be verified on the blockchain."}
                  </p>
                </div>
                
                {/* File Details */}
                {verificationResult.isVerified && verificationResult.details && (
                  <div className="p-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">File Details</h4>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="w-24 text-gray-800">Owner:</span>
                        <span className="text-gray-900 font-mono text-sm">
                          {verificationResult.details.owner === "Not available" || verificationResult.details.owner === "Could not retrieve" 
                            ? verificationResult.details.owner 
                            : `${verificationResult.details.owner.substring(0, 6)}...${verificationResult.details.owner.substring(verificationResult.details.owner.length - 4)}`}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-gray-800">Timestamp:</span>
                        <span className="text-gray-900">{verificationResult.details.timestamp}</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-gray-800">File Name:</span>
                        <span className="text-gray-900">{verificationResult.details.fileName}</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-gray-800">Extension:</span>
                        <span className="text-gray-900">{verificationResult.details.fileExtension}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Hash Information */}
                <div className="p-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">IPFS Hash Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-800">File Hash:</span>
                      <p className="mt-1 font-mono text-sm text-gray-900 break-all bg-gray-50 p-2 rounded">
                        {verificationResult.fileHash}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-800">Metadata Hash:</span>
                      <p className="mt-1 font-mono text-sm text-gray-900 break-all bg-gray-50 p-2 rounded">
                        {verificationResult.metadataHash}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedFile(null);
                  setVerifyStage("hash");
                  setVerifyProgress(0);
                  setVerificationResult(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
