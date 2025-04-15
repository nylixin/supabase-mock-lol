// Only run once page loads
window.onload = function()
{
    console.log("page loaded, trying supabase");
    // link supabaseUrl and Key
    const supabaseUrl = "https://ihwlzvhdchnpakwuvvue.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlod2x6dmhkY2hucGFrd3V2dnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MDcxMzgsImV4cCI6MjA1NjI4MzEzOH0.A1RQgf-h3wp8ihrJYuPy5vbEol1nJxmvbhBppPI5PAs";
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    console.log("Supabase Initialized: ", window.supabase);

    // Register Function
    // Regisers in Supabase auth.users
    window.signUpUser = async function (email, password, firstName, lastName, bio="") {
        try {
            // try to sign in with data
            const {data, error} = await window.supabase.auth.signUp({
                email: email,
                password: password
            })

            if (error) {
                console.error("Signup Failed: ", error);
            } else {
                console.log("Signup Successful", data);
            }

            // make sure user has user ID
            //const userId = authData.user?.id;
            const userId = data.user?.id;
            if (!userId)
            {
                console.error("Failed to Retrieve user ID");
                return;
            }

            const { data: profileData, error: profileError } = await window.supabase
            .from("profiles")
            .insert([
                {
                    id: userId,  
                    firstname: firstName,
                    lastname: lastName,
                    bio: bio
                }
            ]);

            if (profileError) {
                console.error("Error inserting profile:", profileError);
            } else {
                console.log("User profile created:", profileData);
            }
            
        } catch (err) {
            console.error("Unexpected Error: ", err);
        }
    };

    // sign in with google
    window.googleSignInAuth = async function () {
        try {
            const {data, error} = await window.supabase.auth.signInWithOAuth({
                provider: 'google'
            });

            if (error)
            {
                console.error("Error with Google Sign-In:", error);
            } else {
                console.log("Using Google OAuth:", data);
            }
        } catch (err)
        {
            console.error("Unexpected Error with Google Sign-In:", err);
        }
    };

    // listening for google changes
    window.supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN")
        {
            const user = session.user;

            // link to current profile (if active)
            const { data: existingProfile, error: fetchError} = await window.supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

            if (fetchError || !existingProfile)
            {
                const user_metadata = user.user_metadata;
                
                const { data: profileData, error: profileError } = await window.supabase
                .from("profiles")
                .insert([{
                    id: user.id,
                    firstname: user_metadata?.first_name || "",
                    lastname: user_metadata?.last_name || "",
                    bio: ""
                }]);

                if (profileError) {
                    console.error("Error creating profile for Google user:", profileError);
                } else {
                    console.log("Google user profile created:", profileData);
                }
            } else {
                console.log("User profile already active");
            }

            window.location.href = "projListLoggedIn.html";
        }
    })

    // listens for submit button pressed
    const loginForm = document.getElementById("login-form");
    if(loginForm)
    {
        loginForm.addEventListener("submit", loginUser);
        console.log("Login Form Listener Attached");
    } else {
        console.log("Login Form Not Found");
    }

};

// functionality for logging in
async function loginUser(event) {
    event.preventDefault();

    console.log("login attempt started");

    // getting user input
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // clearing error messages
    document.getElementById("error-message").innerText = "";

    // logging in with supabase authentication
    try {
        const {data, error} = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error)
        {
            console.error("Login Error: ", error);
            document.getElementById("error-message").innerText = "Login Failed: " + error.message;
            return;
        }
        console.log("Login Successful: ", data);
        alert("Login successful");
        // re-directed to logged in page
        window.location.href = "projListLoggedIn.html";
        } catch (error) {
            console.error("Supabase Connection Issue: ", error);
            document.getElementById("error-message").innerText = "Login Failed: " + error.message;
        }
}