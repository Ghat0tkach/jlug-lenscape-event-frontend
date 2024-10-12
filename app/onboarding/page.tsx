"use client"
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BarLoader, CircleLoader } from 'react-spinners'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useUserStore from '@/store/useUserStore';
import { FaCamera } from 'react-icons/fa';
import "../../app/globals.css";
import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import local from 'next/font/local';
import { exchangeCodeForTokens, regenerateJwtToken } from '../api/checkServer';
import { getUserDetails } from '../api/userApi';
import { authenticatedFetch, AuthError } from '@/lib/auth.utils';
interface TeamMember {
  name: string;
  email: string;
  branch: string;
  collegeName: string;
  userId: string | null; // Can change this to string | null if userId can be null
}
export default function OnboardingPage() {
  const router = useRouter();
  const { user,setUser,loadUser } = useUserStore();
  const searchParams = useSearchParams();
  
  const [isInvited, setIsInvited] = useState(false);
  const [invitedTeamName, setInvitedTeamName] = useState('');
  const [branch, setBranch] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [isParticipant, setIsParticipant] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([ { name: '', email: '', branch: '', collegeName: '', userId: '' }] as any[]);

   
   
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface TeamMember {
  name: string;
  email: string;
  branch: string;
  collegeName: string;
  userId: string | null | undefined;
  [key: string]: any;
}

  const [photographyLink, setPhotographyLink] = useState('');
  const [photographyTitle, setPhotographyTitle] = useState('');
  const [photoType, setPhotoType] = useState('image');
  const [videographyLink, setVideographyLink] = useState('');
  const [videographyTitle, setVideographyTitle] = useState('');
  const [videoType, setVideoType] = useState('');
  const [digitalArtLink, setDigitalArtLink] = useState('');
  const [digitalArtTitle, setDigitalArtTitle] = useState('');
  const [digitalArtType, setDigitalArtType] = useState(null);
  const [teamLeaderIndex, setTeamLeaderIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [teamId, setTeamId] = useState(uuidv4());
  const [isDriveChecking,setIsDriveChecking]=useState(false);
  const onboarded=searchParams.get("onboarded")
  const [isParticipantStatus, setIsParticipantStatus] = useState(false);
  const invitedTeamId = searchParams.get('teamId');
  let jwtToken:string | null
  let incomingUserData:any
  let refreshToken:string | undefined |null
  const handleAuth = async () => {
    try {
  
      // Fetch team details if invitedTeamId is present
      if (invitedTeamId) await fetchTeamDetails(invitedTeamId.trim().replace(/"/g, ''));
  
      // Exchange code for tokens
      const exchangeResult = await exchangeCodeForTokens();
  
      // If token exchange was successful, set the user
      if (exchangeResult?.user?.user) {
        if(!exchangeResult?.user?.user?.isParticipant && exchangeResult?.user?.user?.isOnboarded && onboarded==null) router.push('/profile');
        setUser(exchangeResult.user.user);
        return;
      }
  
      // Handle failure of token exchange (status not 200)
      if (exchangeResult?.response !== 200) {
        const storedId = localStorage.getItem('_id')?.trim().replace(/"/g, '');
        if (!storedId) {
          toast.error("Session expired. Please login again.");
          router.push('/?error=session_expired');
          return;
        } 


  
        // Get tokens from localStorage
        const jwtToken = localStorage.getItem('jwtToken');
        const refreshToken = localStorage.getItem('refreshToken');
  
        // Fetch user details using stored tokens
        try {
          const incomingUserData = await getUserDetails(storedId, jwtToken, refreshToken || undefined);
  
          if (incomingUserData) {
            setUser(incomingUserData);
          } else {
            toast.error("Unable to fetch user details. Please login again.");
            router.push('/?error=auth_failed');
          }
        } catch (userError) {
          console.error('User details error:', userError);
          toast.error("Session expired. Please login again.");
          router.push('/?error=session_expired');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error("An unexpected error occurred. Please try again.");
      router.push('/?error=unknown');
    } finally {
      setIsPageLoading(false);
    }
  };
  
  // Separate useEffect to watch user and redirect
  useEffect(() => {
    // Redirect if the user is a participant
    if (user?.isParticipant) {
      router.push("/profile");
    }
  }, [user]);
  
  // Initial effect to load tokens and handle authentication
  useEffect(() => {
    jwtToken = localStorage.getItem('jwtToken');
    refreshToken = localStorage.getItem('refreshToken') || undefined;
    handleAuth();
  }, []);
  

  

 
  const fetchTeamDetails = async (teamId: string) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/participant/team/${teamId}`
      );
  
      if (response.ok) {
        const teamResult = await response.json();
        setIsInvited(true);
        setInvitedTeamName(teamResult.teamName);
        setTeamName(teamResult.teamName);
        setTeamId(teamId);
        toast.info(`You've been invited to join ${teamResult.teamName}.`);
      }
    } catch (error) {
      if (error instanceof AuthError) {
        toast.error("Session expired. Please log in again.");
        router.push('/');
      } else {
        console.log('Team details error:', error);
        // toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if(!user?.isParticipant && user?.isOnboarded){
      toast.info("You are already onboarded as a participant. Time to show your skills!",{autoClose: 2000});
      return setIsParticipantStatus(true);
    } 
    setIsParticipant(checked);
  };

  const handleAddMember = () => {
    if (teamMembers.length >= 5) {
      toast.error("Maximum team members reached.");
      return;
    }
    setTeamMembers([...teamMembers, { name: '', email: '', branch: '', collegeName: '' ,userId: ''}]);
  };

  const handleRemoveMember = (index:number) => {
    if (index !== 0) {
      const updatedMembers = teamMembers.filter((_, i) => i !== index);
      setTeamMembers(updatedMembers);
    }
  };

  const handleMemberChange = (index:number, field:string, value:string) => {
    const updatedMembers = [...teamMembers];
    updatedMembers[index][field] = value;
    setTeamMembers(updatedMembers);
  };

  const handleNextStep = async () => {
    if(user!=null){
      setTeamMembers([{ 
        name: user.name, 
        email: user.email, 
        branch: '', 
        collegeName: '', 
        userId: user._id 
      }]);
    }
    
    if (currentStep === 0) {
      if (!branch || !collegeName) {
        toast.error("Branch and College Name are required.");
        return;
      }
      else if(!isParticipant || isInvited) {
        try {
          setIsLoading(true);
          let submittedData = {
            id:user?._id,
            email: user?.email,
            branch,
            collegeName,
            isParticipant: isParticipant,
            teamId: invitedTeamId??null
          };
  
          if(!isParticipant) {
            await handleSubmission(submittedData);
            setIsLoading(false);
          } else if (isInvited && invitedTeamId) {
            await handleSubmission(submittedData);
           
          }
        } catch (error) {
          console.error("Submission error:", error);
          toast.error("An unexpected error occurred. Please try again.");
          
        }finally {
          setIsLoading(false);
        }
      } 
      else {
        setCurrentStep(1);
      }
    } else {
      if (!await validateSubmission()) {
        return;
      }

     if(teamName.trim() === ''){
        toast.error("Team name is required.");
        return;
      }
    
      const memberIndex = teamMembers.findIndex(member => member.userId === user?._id);
      teamMembers[memberIndex].branch = branch;
      teamMembers[memberIndex].collegeName = collegeName;
      if (
        (photographyLink && photographyLink === videographyLink) ||
        (photographyLink && photographyLink === digitalArtLink) ||
        (videographyLink && videographyLink === digitalArtLink)
      ) {
        toast.error("Links should be unique");
        return;
      }
      

      const participantData = {
        teamId,
        teamName,
        teamMembers,
        teamLeader: teamMembers[teamLeaderIndex],
        posts: [
          { category: 'photography', link: photographyLink, title: photographyTitle,type:"image"},
          { category: 'videography', link: videographyLink, title: videographyTitle,type:"video" },
          { category: 'digitalArt', link: digitalArtLink, title: digitalArtTitle,type:"image" }
        ].filter(post => post.link && post.title)
      };
    
      await handleSubmission(participantData);
    }
  };

  const handleSubmission = async (data: any) => {
    setIsLoading(true);
    try {
      const endpoint = isInvited 
        ? `${API_URL}/api/participant/join-team`
        : `${API_URL}/api/participant/onboarding`;
  
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
  
      if (response.ok) {
        const result = await response.json();
        toast.success("Submission successful!");
        router.push(result.teamId ? '/profile' : '/countdown');
      }  
      if(response.status === 400){
        const message=await response.json();
        toast.error(message.message);
        toast.warn("Google drive links should be in this format https://drive.google.com/file/d/{file_id}/view?usp=sharing");
        throw new Error('Invalid image video format or link is inaccessible');
      }
      if(response.status===420){
        const message=await response.json();
        toast.error(message.message);
        return
      }
      if (!response.ok) {

        toast.error('Failed to edit post, Invalid image video format or link is inaccessible');
        throw new Error('Invalid image video format or link is inaccessible');
      }
      
      else if (response.status === 403) {
        toast.error("You are not invited to join this team.");
      } else {
       
      }
    } catch (error) {
      if (error instanceof AuthError) {
        toast.error("Session expired. Please log in again.");
        router.push('/');
      } else {
        
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  
  

  const validateSubmission = async () => {
    const memberEmails = teamMembers.map(member => member.email.toLowerCase());
    const uniqueEmails = new Set(memberEmails);

    if (uniqueEmails.size !== memberEmails.length) {
        toast.error("All team members must have unique email addresses.");
        return false;
    }

    if (!photographyLink && !videographyLink && !digitalArtLink) {
        toast.error("At least one link (Photography, Videography, or Digital Art) must be provided.");
        return false;
    }

    if ((photographyLink && !photographyTitle) || (videographyLink && !videographyTitle) || (digitalArtLink && !digitalArtTitle)) {
        toast.error("Each provided link must have a corresponding post title.");
        return false;
    }

    return true; // All validations passed
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      {isPageLoading ? <BarLoader color="#ffffff" className='fixed ' />
      :
      <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg"
    >
      <Card className="backdrop-blur-md bg-gray-800/50 shadow-xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white flex items-center justify-center">
            <FaCamera className="mr-2 animate-pulse" /> Lenscape
          </CardTitle>
          <CardDescription className="text-xl font-semibold text-gray-300 mt-4">
            {isInvited 
              ? `Welcome ${user?.name.trim().split(" ")[0]}! You've been invited to join ${invitedTeamName}.`
              : `Hello ${user?.name.trim().split(" ")[0]}! Let's complete your profile.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                value={user?.email}
                disabled
                className="bg-gray-700 text-white border-gray-600"
                required
              />
              <Label htmlFor="branch" className="text-white mt-4">Branch</Label>
              <Input
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
                required
              />
              <Label htmlFor="collegeName" className="text-white mt-4">College Name</Label>
              <Input
                id="collegeName"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
                required
              />
              {!isInvited && (
                <div className="flex items-center mt-4">
                  <Checkbox
                    id="isParticipant"
                    checked={isParticipant}
                    onCheckedChange={(value) => handleCheckboxChange(!!value)}
                    className='outline border-gray-600'
                  />
                  <Label htmlFor="isParticipant" className="ml-2  text-white border-slate-200">Are you a participant?</Label>
                </div>
              )}
            </div>
          )}
          {currentStep === 1 && (
            <div>
              <Label htmlFor="teamName" className="text-white">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
                required
                disabled={isInvited}
              />
              <Label className="text-white mt-4">Team Members</Label>
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center mt-2">
                  <Input
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                    placeholder="Member Name"
                    className="bg-gray-700 text-white border-gray-600 mr-2"
                    disabled={isInvited || index === 0}
                  />
                  <Input
                    value={member.email}
                    onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                    placeholder="Member Email"
                    className="bg-gray-700 text-white border-gray-600 mr-2"
                    disabled={isInvited || index === 0}
                  />
                  {!isInvited && index > 0 && (
                    <Button onClick={() => handleRemoveMember(index)} variant="destructive" className="ml-2">
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {!isInvited && (
                <Button onClick={handleAddMember} className="mt-4">Add Team Member</Button>
              )}
              <div className='mt-4 mb-4 gap-3'>
                <Label className="text-white mt-4">Team Leader</Label>
                <p 
                  className=" bg-gradient-to-br from-gray-700 to-slate-900  animate-pulse duration-0 cursor-not-allowed  p-3 text-white border-gray-600 mt-2 rounded-md"
                  onClick={()=>toast.info("Team leader is automatically set to the first member")}>{teamMembers[0]?.name.trim()}</p>
              </div>
              <Label className="text-white mt-4">Photography</Label>
              <Input
                value={photographyLink}
                onChange={(e) => setPhotographyLink(e.target.value)}
                placeholder="Photography Google Drive Link or Youtube Link"
                className="bg-gray-700 text-white border-gray-600 mt-2"
              />
              <Input
                value={photographyTitle}
                onChange={(e) => setPhotographyTitle(e.target.value)}
                placeholder="Photography Post Title"
                className="bg-gray-700 text-white border-gray-600 mt-2"
              />
              <Label className="text-white mt-16">Videography</Label>
              <Input
                value={videographyLink}
                onChange={(e) => setVideographyLink(e.target.value)}
                placeholder="Videography  Google Drive Link or Youtube Link"
                className="bg-gray-700 text-white border-gray-600 mt-2"
              />
              <Input
                value={videographyTitle}
                onChange={(e) => setVideographyTitle(e.target.value)}
                placeholder="Videography Post Title"
                className="bg-gray-700 text-white border-gray-600 mt-2"
              />
              <Label className="text-white mt-4">Digital Art</Label>
              <Input
                value={digitalArtLink}
                onChange={(e) => setDigitalArtLink(e.target.value)}
                placeholder="Digital Art Google Drive Link or Youtube Link"
                className="bg-gray-700 text-white border-gray-600 mt-2"
              />
              <Input
                value={digitalArtTitle}
                onChange={(e) => setDigitalArtTitle(e.target.value)}
                placeholder="Digital Art Post Title"
                className="bg-gray-700 text-white border-gray-600 mt-2"
              />
              <p className="text-sm text-gray-400 mt-4">Note: Post titles and links can be edited until the voting day.</p>
            </div>
          )}
        </CardContent>
        <div className="flex justify-between px-4 pb-4">
          <Button  disabled={isLoading || isDriveChecking} onClick={() => currentStep === 0 ? router.push('/') : setCurrentStep(0)}>
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>
          {isLoading && <BarLoader color="#ffffff" />}
          <div className="flex items-center space-x-2">
  {isDriveChecking && (
    <>
      <CircleLoader color="#4CAF50" size={16} />
      <p className="text-green-500 text-xs font-medium animate-pulse">
        Verifying Google Drive link...
      </p>
    </>
  )}
</div>

          <Button onClick={handleNextStep} disabled={isLoading || isDriveChecking}>
          {currentStep === 0 
          ? (isInvited 
              ? "Join Team" 
              : (isParticipant ? "Next" : "Submit"))
          : "Submit"}

          </Button>
        </div>
      </Card>
    </motion.div>
      }
     
      <ToastContainer />
    </div>
  );
}
