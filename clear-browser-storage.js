// Quick fix for clearing corrupted auth state
// Run this in browser console to clear all Supabase auth data

// Clear all local storage
localStorage.clear();

// Clear all session storage  
sessionStorage.clear();

// Clear all cookies for this domain
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('✅ Browser storage cleared. Refresh the page to start fresh.');