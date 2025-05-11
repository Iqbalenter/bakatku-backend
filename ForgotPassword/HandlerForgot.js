const admin = require('../firebase/firebaseAdmin');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: '',
      pass: '',
    },
  });

const ForgotPassword = async(req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            code: 400,
            status: 'Bad Request',
            data: {
                message: 'Email is required'
            }
        });
    }

    try {
        const resetLink = await admin.auth().generatePasswordResetLink(email);

        await transporter.sendMail({
            from: '',
            to: email,
            subject: 'Reset your password for Bakatku',
            text: `Hi there,

We received a request to reset the password for your Fat Track account associated with this email: ${email}. 

To reset your password, please click on the link below or copy and paste it into your browser:
${resetLink}

If you did not request to reset your password, you can safely ignore this email. 

Thank you,
The Bakatku Team`
        });
    
    res.status(200).json({
        code: 200,
        status: 'Success',
        data: {
            message: 'Email sent successfully'
        }
    });

    } catch (error) {
        console.error('Error while sending email:', error);
        res.status(500).json({
            status: 'fail',
            data: {
                message: 'Gagal mengirim ke email, coba lagi nanti',
                error: error.message,
            },
        });
    }
}


module.exports = {ForgotPassword};