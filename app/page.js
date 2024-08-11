'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Button, Stack, TextField, Typography, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { auth, signInWithGoogle, signOutUser, saveConversation, fetchConversations, deleteConversation, getUserProfilePic } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function Home() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm SecuraBot, your cybersecurity assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [profilePic, setProfilePic] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const savedConversations = await fetchConversations(currentUser.uid);
          setConversations(savedConversations);

          // Fetch user profile picture
          const userProfilePic = await getUserProfilePic(currentUser.uid);
          setProfilePic(userProfilePic);
        } catch (error) {
          console.error('Error fetching conversations:', error);
        }
      } else {
        setUser(null);
        setMessages([
          {
            role: 'assistant',
            content: "Hi! I'm SecuraBot, your cybersecurity assistant. How can I help you today?",
          },
        ]);
        setConversations([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    if (newValue === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm SecuraBot, your cybersecurity assistant. How can I help you today?",
        },
      ]);
    } else {
      setMessages(conversations[newValue - 1]?.conversation || []);
    }
  };

  const startNewConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm SecuraBot, your cybersecurity assistant. How can I help you today?",
      },
    ]);
    setSelectedTab(0);
  };

  const removeConversation = async (conversationId) => {
    if (user) {
      try {
        await deleteConversation(user.uid, conversationId);
        const updatedConversations = await fetchConversations(user.uid);
        setConversations(updatedConversations);
        setSelectedTab(0);
      } catch (error) {
        console.error('Error removing conversation:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    const userMessage = { role: 'user', content: message };

    const newMessages = [...messages, userMessage, { role: 'assistant', content: '' }];
    setMessages(newMessages);
    setMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessages),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        assistantMessage += text;

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1].content = assistantMessage;
          return updatedMessages;
        });
      }

      if (user) {
        try {
          await saveConversation(user.uid, newMessages);
          const updatedConversations = await fetchConversations(user.uid);
          setConversations(updatedConversations);
        } catch (error) {
          console.error('Error saving conversation:', error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'black', color: '#02E901', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <img src='/assets/logo.png' alt="SecuraBot" style={{ marginBottom: '16px', width: isMobile ? '150px' : '200px' }} />
        <Typography variant={isMobile ? 'h6' : 'h4'} sx={{ mb: 4 }}>Your Cybersecurity Assistant</Typography>
        <Button variant="contained" color="success" onClick={signInWithGoogle}>
          Continue with Google
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'black', color: '#02E901', flexDirection: isMobile ? 'column' : 'row' }}>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant={isMobile ? 'temporary' : 'persistent'}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '75%' : 240,
            backgroundColor: 'black',
            color: 'white',
          },
        }}
      >
        <Stack spacing={2} sx={{ padding: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <img src={profilePic} alt="Profile" style={{ borderRadius: '50%', width: '40px', height: '40px', marginRight: '10px' }} />
            <Typography variant="h6" sx={{ color: 'white', fontSize: isMobile ? '14px' : 'inherit' }}>Welcome, {user?.displayName}</Typography>
          </Box>
          <List>
            <ListItem button selected={selectedTab === 0} onClick={() => handleTabChange(null, 0)} sx={{ backgroundColor: selectedTab === 0 ? '#333' : 'transparent', color: 'white' }}>
              <ListItemText primary="New Chat" />
            </ListItem>
          </List>
          <Button variant="contained" color="error" onClick={signOutUser} sx={{ marginTop: 'auto' }}>
            Sign Out
          </Button>
        </Stack>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ backgroundColor: 'black', padding: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid #333' }}>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ flexGrow: 1 }}>SecuraBot</Typography>
          <Button variant="outlined" color="success" onClick={startNewConversation}>
            New Conversation
          </Button>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', padding: 2 }}>
          {messages.map((message, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: message.role === 'assistant' ? 'flex-start' : 'flex-end', marginBottom: 1 }}>
              <Box sx={{
                backgroundColor: message.role === 'assistant' ? '#02E901' : '#333',
                color: message.role === 'assistant' ? 'black' : 'white',
                borderRadius: 2,
                padding: 2,
                maxWidth: '70%',
                wordBreak: 'break-word',
              }}>
                <Typography>{message.content}</Typography>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ padding: 2, borderTop: '1px solid #333', backgroundColor: 'black' }}>
          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            fullWidth
            multiline
            minRows={2}
            variant="outlined"
            InputProps={{
              sx: {
                backgroundColor: '#222',
                color: 'white',
                '& fieldset': { borderColor: '#333' },
              },
            }}
            disabled={isLoading}
          />
          <Button variant="contained" color="success" onClick={sendMessage} disabled={isLoading} sx={{ marginTop: 2, display: 'block', marginLeft: 'auto' }}>
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
