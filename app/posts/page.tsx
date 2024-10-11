"use client"

import { useState, useRef, useEffect } from 'react'
import TinderCard from 'react-tinder-card'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, RotateCcw, Instagram, Play, Pause, Group, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { postApi } from "@/app/api/posts"
import React from 'react'
import Image from 'next/image'
import ReactPlayer from 'react-player'

import "../../app/globals.css"
import { toast } from 'react-toastify'

interface Submission {
  _id: string
  teamName: string
  domain: string
  title: string
  url: string
  type: string
  votes: string[]
}

export default function LenscapeVoting() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lastDirection, setLastDirection] = useState<string | undefined>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null)
  const [likedIndex, setLikedIndex] = useState<number | null>(null)
  const currentIndexRef = useRef(currentIndex)
  const videoRef = useRef<ReactPlayer>(null)
  const childRefs = useRef<any[]>([])
  let  userId=localStorage.getItem('_id');
  if (userId && userId.startsWith('"') && userId.endsWith('"')) {
    userId = userId.slice(1, -1); // Remove the first and last character (the quotes)
}

  const fetchData = async () => {
    try {
      let response = await postApi.getAllPosts();
      setSubmissions(response);
      setCurrentIndex(response.length - 1);
      childRefs.current = response.map(() => React.createRef())
      console.log(response);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  
  useEffect(() => {
    fetchData();
   
  }, []);

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val)
    currentIndexRef.current = val
  }

  const canGoBack = currentIndex < submissions.length - 1
  const canSwipe = currentIndex >= 0

  const swiped =async (direction: string, nameToDelete: string, index: number) => {
    if(direction === 'right'){
       let userId=localStorage.getItem('_id');
       if (userId && userId.startsWith('"') && userId.endsWith('"')) {
        userId = userId.slice(1, -1); // Remove the first and last character (the quotes)
    }
    try {
     let  response=await postApi.votePost(submissions[index]._id,userId);
     toast.success(response.message);
     
    } catch (error) {
      toast.error("Failed to vote post");
    }
      
    }
    console.log(`swiped ${direction} on ${nameToDelete}`)
    setLastDirection(direction)
    updateCurrentIndex(index - 1)
    if (playingVideoIndex === index) {
      setIsPlaying(false)
      setPlayingVideoIndex(null)
    }
    if (direction === 'right') {
      setLikedIndex(index)
      setTimeout(() => setLikedIndex(null), 800) // Reset after animation
    }
  }

  const outOfFrame = (name: string, idx: number) => {
    if (currentIndexRef.current >= idx) {
      childRefs.current[idx].current.restoreCard()
    }
  }

  const swipe = async (dir: string) => {
    console.log(`Swiped ${dir}`)
    if (canSwipe && currentIndex < submissions.length) {
      await childRefs.current[currentIndex].current.swipe(dir)
    }
  }

  const goBack = async () => {
    if (!canGoBack) return
    const newIndex = currentIndex + 1
    updateCurrentIndex(newIndex)
    await childRefs.current[newIndex].current.restoreCard()
  }

  const togglePlay = (index: number) => {
    if (playingVideoIndex === index) {
      setIsPlaying(!isPlaying)
    } else {
      setIsPlaying(true)
      setPlayingVideoIndex(index)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      <h1 className="text-5xl font-bold mb-8 text-white tracking-wider">LENSCAPE</h1>
      <div className="relative w-full max-w-sm h-[600px]">
        <AnimatePresence>
          {submissions.map((submission, index) => (
            index >= currentIndex && (
              <TinderCard
                ref={childRefs.current[index]}
                key={submission._id}
                onSwipe={(dir) => swiped(dir, submission.teamName, index)}
                onCardLeftScreen={() => outOfFrame(submission.teamName, index)}
                className="absolute w-full h-[560px]"
                swipeRequirementType="position"
                swipeThreshold={100}
                preventSwipe={['up', 'down']}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full h-full cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'pan-x' }}
                >
                  <Card className={`overflow-hidden h-full shadow-xl rounded-xl bg-gray-800 border-gray-700 transition-all duration-300 ${likedIndex === index ? 'scale-95 opacity-80' : ''}`}>
                    <CardContent className="p-0 h-full flex flex-col">
                      <div className="relative flex-grow">
                        {submission.type.startsWith("image") ? (
                          <Image
                            src={`https://drive.google.com/uc?export=view&id=${submission.url.split('/d/')[1].split('/')[0]}`}
                            alt={`Submission by ${submission.teamName}`}
                            className="w-full h-full object-cover"
                            draggable="false"
                            width={500}
                            height={500}
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <ReactPlayer
                              ref={videoRef}
                              url={submission.url}
                              width="100%"
                              height="100%"
                              className="w-full h-full object-cover"
                              loop
                              playing={isPlaying && playingVideoIndex === index}
                            />
                           
                          </div>
                        )}
                        <div className="absolute bottom-4 right-4 bg-white flex rounded-full gap-2 p-2 transition-opacity hover:bg-opacity-75">
                          <Heart className={`h-6 w-6 text-red-500 ${userId?submission.votes.includes(userId)?'fill-red-500':"":""}`}/>
                          <p className='text-red-600'>{submission.votes.length}</p>
                        
                         
                       </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                          <h2 className="text-2xl font-semibold text-white">{submission.title}</h2>
                          <p className="text-lg text-white">{submission.domain}</p>
                          <p className='text-white'>@{submission.teamName}</p>
                        
                           
                        </div>
                         
                      </div>
                    </CardContent>
                  </Card>
                  <AnimatePresence>
                    {lastDirection === 'left' && index === currentIndex + 1 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-4 left-4 bg-red-500 text-white px-3 py-2 rounded-full text-lg font-semibold shadow-lg"
                      >
                        Ignored
                      </motion.div>
                    )}
                    {(lastDirection === 'right' && index === currentIndex + 1) || likedIndex === index ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-full text-lg font-semibold shadow-lg"
                      >
                        Good
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </TinderCard>
            )
          ))}
        </AnimatePresence>
      </div>
      <div className="flex justify-center mt-8 space-x-6">
        <Button
          variant="outline"
          size="lg"
          onClick={() => swipe('left')}
          disabled={!canSwipe}
          className="bg-transparent hover:bg-red-900 text-red-500 border-red-500 hover:border-red-600"
        >
          <ChevronLeft className="h-6 w-6 mr-2" />
          Will Check Later
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => goBack()}
          disabled={!canGoBack}
          className="bg-transparent hover:bg-blue-900 text-blue-500 border-blue-500 hover:border-blue-600"
        >
          <RotateCcw className="h-6 w-6 mr-2" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => swipe('right')}
          disabled={!canSwipe}
          className="bg-transparent hover:bg-green-900 text-green-500 border-green-500 hover:border-green-600"
        >
          Like
          <ChevronRight className="h-6 w-6 ml-2" />
        </Button>
      </div>
    </div>
  )
}