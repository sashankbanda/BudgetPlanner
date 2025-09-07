import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { AspectRatio } from '../ui/aspect-ratio';
import { HelpCircle } from 'lucide-react';

const GuideModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    // NOTE: Replace this with your actual YouTube video ID
    const videoId = "ZcdskdApbgk"; 

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="glass-button">
                    <HelpCircle className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-0 text-white max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="electric-accent">App Guide: A Quick Tour</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <AspectRatio ratio={16 / 9} className="rounded-lg overflow-hidden border border-white/10">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </AspectRatio>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default GuideModal;