"use client";

import React, { useState } from 'react';
import PostalEntryModal from './PostalEntryModal';

interface PostalEntryTriggerProps {
    label: string;
}

const PostalEntryTrigger: React.FC<PostalEntryTriggerProps> = ({ label }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="inline-block bg-[#D4AF37] btn-gold-safe text-white text-[13px] font-bold uppercase px-6 py-2.5 rounded-sm shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
                {label}
            </button>

            <PostalEntryModal 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
            />
        </>
    );
};

export default PostalEntryTrigger;
