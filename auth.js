// Only run once page loads
window.addEventListener("load", async function () {
    console.clear();
    console.log("page loaded, trying supabase");

    // link supabaseUrl and Key
    const supabaseUrl = "https://ihwlzvhdchnpakwuvvue.supabase.co"
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlod2x6dmhkY2hucGFrd3V2dnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MDcxMzgsImV4cCI6MjA1NjI4MzEzOH0.A1RQgf-h3wp8ihrJYuPy5vbEol1nJxmvbhBppPI5PAs";
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    console.log("Supabase Initialized: ", window.supabase);

    // check if user is alr signed in
    const { data: {user}} = await window.supabase.auth.getUser();
    if (user) 
    {
        console.log("Already signed in. Redirecting..");
        window.location.replace("projListLoggedIn.html");
        return;
    }

    // Register Function
    // Regisers in Supabase auth.users
    window.signUpUser = async function (email, password, firstName, lastName, bio="") {
        try {
            // try to sign in with data
            const {data, error} = await window.supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) console.error("Signup Failed: ", error);
            else console.log("Signup Successful", data);

            // make sure user has user ID
            //const userId = authData.user?.id;
            const userId = data.user?.id;
            if (!userId) return console.error("Failed to Retrieve user ID");

            const { error: profileError } = await window.supabase
                .from("profiles")
                .insert([{id: userId, firstname: firstName, lastname: lastName, bio: bio }]);

            if (profileError) console.error("profile insert error:", profileError);
            else console.log("profile generated successfully");
        } catch (err) {
            console.error("unexpected signup error:", err);
        }
    };

    // sign in with google
    window.googleSignInAuth = async function () {
        try {
            const {data, error} = await window.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'https://nylixin.github.io/supabase-mock-lol/loginPageMockSupa.html'
                }
            });

            if (error) console.error("google signin error:", error);
            else console.log("google oauth initiated:", data);

        } catch (err) {
            console.error("google oauth error", err);
        }
    };

    // listening for google changes, i.e. google or manual login
    window.supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN") {
        const user = session.user;
        console.log("auth state changed: SIGNED_IN");

        // link to current profile (if active)
        const { data: existingProfile } = await window.supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

        if (!existingProfile) {
            const metadata = user.user_metadata || {};
            await window.supabase.from("profiles").insert([{
                id: user.id,
                firstname: metadata.given_name || "",
                lastname: metadata.family_name || "",
                bio: ""
            }]);
            console.log("created new user profile");
        }

        console.log("signed in, redirecting from onAuthStateChange");
        window.location.replace("projListLoggedIn.html");
        }
    });

    // listens for submit button pressed
    const loginForm = document.getElementById("login-form");
    if(loginForm) {
        loginForm.addEventListener("submit", loginUser);
        console.log("Login Form Listener Attached");
    } else {
        console.log("Login Form Not Found");
    }
});

// functionality for logging in
async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorDisplay = document.getElementById("error-message");

    console.log("login attempt started");
    console.log("email:", email);
    console.log("pass entered: [hidden]");
    console.log("calling signInWithPassword");

    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email,
            password,
        });

        console.log("Returned from signInWithPassword:", data, error);

        if (error) {
            console.error("Login error:", error.message);
            errorDisplay.innerText = "Login failed: " + error.message;
            return;
        }

        const user = data.user;
        if (!user) {
            console.error("Login succeeded but no user returned");
            errorDisplay.innerText = "Login failed: No user in response.";
            return;
        }

        console.log("✅ Login successful! Redirecting now...");
        alert("Login successful!");
        window.location.replace("projListLoggedIn.html");  // ← safer redirect

    } catch (err) {
        console.error("Unexpected error:", err.message);
        errorDisplay.innerText = "Unexpected error: " + err.message;
    }
}

