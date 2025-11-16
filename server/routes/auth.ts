import express from 'express';
import passport from '../auth/google-strategy';

const router = express.Router();

// Initiate Google OAuth
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback
router.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/?error=auth_failed',
    successRedirect: '/'
  })
);

// Logout
router.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('[Auth] Logout error:', err);
    }
    res.redirect('/');
  });
});

// Get current user
router.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;
