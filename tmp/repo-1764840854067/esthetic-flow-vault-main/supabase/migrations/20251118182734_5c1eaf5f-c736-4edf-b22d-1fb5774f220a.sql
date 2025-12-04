-- Allow patients to insert their own implants
CREATE POLICY "Patients can insert own implants"
ON public.implants
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'patient'::app_role) 
  AND patient_id IN (
    SELECT patient_id 
    FROM patient_users 
    WHERE id = auth.uid()
  )
);