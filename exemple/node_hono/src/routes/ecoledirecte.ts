import { Hono } from "hono";
import { EcoleDirecteService } from "../services/ecoledirecte.service";
import { decodeBase64 } from "../utils/base64";
import { findAnswer } from "../utils/qcm";

const ecoleDirecteRoutes = new Hono();
const ecoleDirecteService = new EcoleDirecteService();

// Authentication route with automatic QCM response
ecoleDirecteRoutes.post("/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    // Get the GTK, we need it only for the first login
    const gtkData = await ecoleDirecteService.getGTK();

    // Login attempt
    const loginData = {
      username,
      password,
      isReLogin: false,
      uuid: "",
    };

    let loginResponse = await ecoleDirecteService.login(gtkData, loginData);

    // If no double authentication is required, return success directly
    if (loginResponse.code !== 250) {
      return c.json({
        success: true,
        token: loginResponse.token,
        accounts: loginResponse.data.accounts,
      });
    }

    // Handle double authentication
    console.log("QCM verification required");

    // Get the QCM
    const qcmJson = await ecoleDirecteService.getQCM(
      gtkData,
      loginResponse.token
    );

    // Decode the question and propositions
    const questionBase64 = qcmJson.data.question;
    const propositionsBase64 = qcmJson.data.propositions;
    const question = decodeBase64(questionBase64);
    const propositions = propositionsBase64.map((p) => decodeBase64(p));

    // Search for the answer in our knowledge base
    const autoAnswer = findAnswer(question);

    // Error if no answer found in our knowledge base
    if (!autoAnswer) {
      // Unknown answer - error with details to add to configuration
      return c.json({
        code: 404,
        message:
          "Unknown QCM question - Please add this question to your configuration",
        question,
        propositions,
        errorType: "unknown",
        configFile: "src/config/qcm.ts",
        configFormat: `"${question}": "YOUR_ANSWER"`,
      });
    }

    // Find the index of the answer in the propositions
    const answerIndex = propositions.findIndex(
      (p) => p.toLowerCase().trim() === autoAnswer.toLowerCase().trim()
    );

    // Error if answer doesn't match any proposition
    if (answerIndex === -1) {
      // Known answer but doesn't match any proposition
      return c.json({
        code: 400,
        message: "The automatic answer doesn't match any proposition",
        question,
        propositions,
        knownAnswer: autoAnswer,
        errorType: "mismatch",
      });
    }

    // We have a valid answer, submit it
    console.log(`Automatic answer found: "${autoAnswer}"`);
    const choiceBase64 = propositionsBase64[answerIndex];

    // Send the answer automatically
    const qcmResult = await ecoleDirecteService.answerQCM(
      gtkData,
      loginResponse.token,
      choiceBase64
    );

    const finalLoginData = {
      username,
      password,
      isReLogin: false,
      uuid: "",
      fa: [{ cn: qcmResult.data.cn, cv: qcmResult.data.cv }],
    };

    // Final login
    loginResponse = await ecoleDirecteService.login(gtkData, finalLoginData);

    return c.json({
      success: true,
      token: loginResponse.token,
      accounts: loginResponse.data.accounts,
      autoQcmAnswered: true,
      autoAnswer,
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Route to get the assignment notebook
ecoleDirecteRoutes.get("/assignments/:studentId", async (c) => {
  try {
    const studentId = c.req.param("studentId");
    const token = c.req.header("Authorization");

    if (!token) {
      return c.json({ error: "Authorization token missing in header" }, 401);
    }

    // Get the assignment notebook
    const assignmentData = await ecoleDirecteService.getAssignmentNotebook(
      Number(studentId),
      token
    );

    return c.json(assignmentData);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

ecoleDirecteRoutes.get("/assignments/:studentId/:date", async (c) => {
  try {
    const studentId = c.req.param("studentId");
    const date = c.req.param("date");
    const token = c.req.header("Authorization");

    if (!token) {
      return c.json({ error: "Authorization token missing in header" }, 401);
    }

    const assignmentData = await ecoleDirecteService.getAssignmentsByDate(
      Number(studentId),
      token,
      date
    );

    return c.json(assignmentData);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

ecoleDirecteRoutes.get("/notes/:studentId", async (c) => {
  try {
    const studentId = c.req.param("studentId");
    const token = c.req.header("Authorization");

    if (!token) {
      return c.json({ error: "Authorization token missing in header" }, 401);
    }

    const notesData = await ecoleDirecteService.getNotes(
      Number(studentId),
      token
    );

    return c.json(notesData);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default ecoleDirecteRoutes;
