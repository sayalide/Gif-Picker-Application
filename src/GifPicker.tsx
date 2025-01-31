import React, { useState, useEffect, ChangeEvent, KeyboardEvent, lazy, Suspense } from "react";
import { Button, TextField, CircularProgress, Typography, Paper, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from "@material-ui/core";
import { Search } from "@material-ui/icons";

const API_KEY = "oWMik3POHlNAyTrd6mVPMIpR20X0Lw1E";

interface Gif {
  id: string;
  images: {
    fixed_width: {
      mp4: string;
    };
  };
}

const LazyGifPicker: React.FC = lazy(() => import("./GifPicker"));

const App: React.FC = () => {
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPicker(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "20vh" }}>
      {showPicker ? (
        <Suspense fallback={<CircularProgress />}>
          <LazyGifPicker />
        </Suspense>
      ) : (
        <CircularProgress />
      )}
    </div>
  );
};

const GifPicker: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [copied, setCopied] = useState<string>("");
  const [limitExceeded, setLimitExceeded] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [openAboutDialog, setOpenAboutDialog] = useState<boolean>(false);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [lastRequestTimestamp, setLastRequestTimestamp] = useState<number | null>(null);

  useEffect(() => {
    const fetchRandomGifs = async () => {
      try {
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=3`
        );
        const data = await response.json();

        if (response.status === 429) {
          setLimitExceeded(true);
        } else {
          const gifData = data.data.map((gif: any) => ({
            id: gif.id,
            images: gif.images,
          }));
          setGifs(gifData);
        }
      } catch (error) {
        console.error("Error fetching random GIFs:", error);
      }
    };

    fetchRandomGifs();
  }, []);

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);

    try {
      if (value.trim() !== "") {
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/search/tags?api_key=${API_KEY}&q=${encodeURIComponent(
            value
          )}&limit=5`
        );
        const data = await response.json();

        if (response.status === 200) {
          const suggestionsData = data.data.map((suggestion: any) => suggestion.name);
          setSuggestions(suggestionsData);
        }
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
    }
  };

  const handleSuggestionClick = async (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    suggestion: string
  ) => {
    event.preventDefault();
    setQuery(suggestion);
    await searchGifs(suggestion);
  };

  const searchGifs = async (searchQuery?: string) => {
  setSuggestions([]); // Clear suggestions

  const queryValue = searchQuery || query;
  if (queryValue.trim() === "") {
    return;
  }

  setLoading(true);
  setError(false);
  setLimitExceeded(false); // Reset the limit exceeded state

  try {
    if (requestCount >= 42 || requestCount >= 1000) {
      setLimitExceeded(true); // Set the limit exceeded state
      alert("API limit reached. You can only see previous results.");
    } else {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(
          queryValue
        )}&limit=10&format=mp4` // Specify format=mp4
      );

      if (response.status === 429) {
        setLimitExceeded(true); // Set the limit exceeded state
        alert("API limit reached. You can only see previous results.");
      } else {
        const data = await response.json();
        const gifData = data.data.map((gif: any) => ({
          id: gif.id,
          images: gif.images,
        }));
        setGifs(gifData);
      }
    }
  } catch (error) {
    console.error("Error searching GIFs:", error);
    setError(true);
  }

  setLoading(false);

  // Update the request count and last request timestamp
  setRequestCount((prevCount) => prevCount + 1);
  setLastRequestTimestamp(Date.now());
};

  
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => {
      setCopied("");
      if (document.hasFocus()) {
        window.alert("GIF URL copied to clipboard!");
      }
    }, 100);
  };
  
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      searchGifs();
    }
  };

  const handleAboutClick = () => {
    setOpenAboutDialog(true);
  };

  const handleAboutClose = () => {
    setOpenAboutDialog(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <TextField
          label="Search for GIFs"
          value={query}
          onChange={handleInputChange}
          variant="outlined"
          fullWidth
          onKeyPress={handleKeyPress}
          style={{ marginRight: 8 }}
        />
        <Button variant="contained" color="primary" onClick={() => searchGifs()}>
          <Search />
        </Button>
        <Button variant="outlined" onClick={handleAboutClick} style={{ marginLeft: 8 }}>
          About
        </Button>
      </div>
      {suggestions.length > 0 && (
        <Paper style={{ position: "relative", marginTop: 16 }}>
          {suggestions.map((suggestion) => (
            <Typography
              key={suggestion}
              variant="body2"
              onClick={(event) => handleSuggestionClick(event as any, suggestion)}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                padding: 8,
                fontWeight: "bold",
                marginBottom: 8,
                borderRadius: 4,
              }}
            >
              {suggestion}
            </Typography>
          ))}
        </Paper>
      )}

      {loading && <CircularProgress style={{ marginTop: 16 }} />}
      {limitExceeded && (
        <Typography color="error" style={{ marginTop: 16 }}>
          API limit exceeded. Please try again later.
        </Typography>
      )}
      {error && <Typography color="error" style={{ marginTop: 16 }}>Error fetching GIFs.</Typography>}
      <Grid container spacing={2} style={{ marginTop: 16 }}>
        {gifs.length > 0 ? (
          gifs.map((gif) => (
            <Grid item xs={4} key={gif.id}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <video autoPlay loop src={gif.images.fixed_width.mp4} style={{ width: "100%", marginBottom: 8 }}></video>
                <Button
                  variant="contained"
                  onClick={() => copyToClipboard(gif.images.fixed_width.mp4)}
                  style={{
                    width: "100%",
                    backgroundColor: "#2196f3",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {copied === gif.images.fixed_width.mp4 ? "Copied!" : "Copy to Clipboard"}
                </Button>
              </div>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="body2" style={{ color: "white", backgroundColor: "#f44336", padding: 8, borderRadius: 4 }}>
              No GIFs found.
            </Typography>
          </Grid>
        )}
      </Grid>
      <Dialog open={openAboutDialog} onClose={handleAboutClose}>
        <DialogTitle>About GIPHY</DialogTitle>
        <DialogContent>
          <Typography>
            GIPHY is an online database and search engine that allows users to search for and share animated GIF files.
            You can find more information about GIPHY on their website:
          </Typography>
          <Typography>
            <a href="https://giphy.com/" target="_blank" rel="noopener noreferrer">
              https://giphy.com/
            </a>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAboutClose} color="primary" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default GifPicker;
