-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Clinic staff can create notifications
CREATE POLICY "Clinic staff can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'clinic_admin'::app_role) OR 
  has_role(auth.uid(), 'provider'::app_role) OR 
  has_role(auth.uid(), 'assistant'::app_role)
);

-- Clinic staff can delete notifications
CREATE POLICY "Clinic staff can delete notifications"
ON public.notifications
FOR DELETE
USING (
  has_role(auth.uid(), 'clinic_admin'::app_role) OR 
  has_role(auth.uid(), 'provider'::app_role) OR 
  has_role(auth.uid(), 'assistant'::app_role)
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create control check notifications
CREATE OR REPLACE FUNCTION public.create_control_check_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  treatment_record RECORD;
  patient_user_id UUID;
BEGIN
  -- Find treatments that need control checks (2 weeks after treatment)
  FOR treatment_record IN
    SELECT t.id, t.patient_id, t.treatment_type, t.treatment_date, p.first_name, p.last_name
    FROM treatments t
    JOIN patients p ON p.id = t.patient_id
    WHERE t.treatment_date <= (CURRENT_DATE - INTERVAL '14 days')
      AND t.treatment_date >= (CURRENT_DATE - INTERVAL '21 days')
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.related_entity_id = t.id
          AND n.type = 'control_check'
          AND n.created_at > (CURRENT_DATE - INTERVAL '21 days')
      )
  LOOP
    -- Get the user_id for this patient
    SELECT id INTO patient_user_id
    FROM patient_users
    WHERE patient_id = treatment_record.patient_id
    LIMIT 1;
    
    IF patient_user_id IS NOT NULL THEN
      -- Create notification
      INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
      VALUES (
        patient_user_id,
        'Control Check Reminder',
        'It''s time for your ' || treatment_record.treatment_type || ' control check. Please schedule an appointment.',
        'control_check',
        'treatment',
        treatment_record.id
      );
    END IF;
  END LOOP;
END;
$$;