// src/pages/NotFoundPage.jsx
import React from "react";
import { Button, Result, Typography } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're in the school dashboard context
  const isSchoolDashboard = location.pathname.startsWith("/school-dashboard");

  return (
    <div className="p-6" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Result
        status="404"
        title={<Title level={1}>404</Title>}
        subTitle={
          <Paragraph>
            Sorry, the page <strong>{location.pathname}</strong> is coming soon.
          </Paragraph>
        }
        extra={
          <Button
            type="primary"
            icon={<HomeOutlined />}
            size="large"
            onClick={() => navigate(isSchoolDashboard ? "/school-dashboard" : "/")}
          >
            {isSchoolDashboard ? "Back to Dashboard" : "Back to Home"}
          </Button>
        }
      />
    </div>
  );
};

export default NotFoundPage;