// Replace 'YOUR_TAG' with the player's tag (without the #)
fetch('/api/player/YOUR_TAG')
  .then(res => res.json())      // Convert response to JSON
  .then(data => {
    console.log('Player Data:', data);  // Check data in console
    // Here you could update the HTML to show player info
  })
  .catch(err => {
    console.error('Error fetching player:', err); // Show error if request fails
  });