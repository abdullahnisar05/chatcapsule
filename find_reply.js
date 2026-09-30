const fs = require('fs');

const findReply = () => {
    console.log("Checking structure. Please run this against a valid message JSON if available.");
    // Typically, Instagram JSON looks like this:
    /*
    {
      "sender_name": "John Doe",
      "timestamp_ms": 1612345678,
      "content": "Haha yeah",
      "is_unsent": false
      // Where does the reply go?
    }
    */
};

findReply();
